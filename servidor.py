#!/usr/bin/env python3
"""Servidor local, sem dependências, com banco SQLite e acesso restrito a loopback."""
import argparse
import json
import os
from pathlib import Path
import secrets
import sqlite3
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit
import webbrowser

ROOT = Path(__file__).resolve().parent
STATIC = {'/': ('index.html', 'text/html; charset=utf-8'), '/index.html': ('index.html', 'text/html; charset=utf-8'), '/app.js': ('app.js', 'text/javascript; charset=utf-8'), '/styles.css': ('styles.css', 'text/css; charset=utf-8'), '/assets/logo-roque.png': ('assets/logo-roque.png', 'image/png')}
TOKEN = secrets.token_urlsafe(32)
DB = None


def connect():
    connection = sqlite3.connect(DB, timeout=15)
    connection.row_factory = sqlite3.Row
    return connection


def initialize(path):
    global DB
    DB = Path(path).resolve()
    DB.parent.mkdir(parents=True, exist_ok=True)
    with connect() as conn:
        conn.execute('CREATE TABLE IF NOT EXISTS curriculos (id INTEGER PRIMARY KEY, nome TEXT NOT NULL, dados TEXT NOT NULL, atualizado TEXT NOT NULL DEFAULT (strftime(\'%Y-%m-%dT%H:%M:%fZ\',\'now\')))')
    try:
        DB.chmod(0o600)
    except OSError:
        pass


def validate(doc):
    if not isinstance(doc, dict) or doc.get('format') != 'meu-curriculo' or type(doc.get('version')) is not int or doc['version'] != 1:
        raise ValueError('Formato de currículo inválido.')
    data = doc.get('data')
    if not isinstance(data, dict) or not isinstance(data.get('name'), str) or not data['name'].strip() or len(data['name']) > 120:
        raise ValueError('Informe um nome de até 120 caracteres antes de salvar.')
    text_keys = ['city', 'uf', 'phone', 'email', 'link', 'objective', 'summary', 'technical', 'personal', 'languages', 'additional', 'photo']
    for key in text_keys:
        if not isinstance(data.get(key), str) or len(data[key]) > (1500000 if key == 'photo' else 3000):
            raise ValueError('Dados inválidos.')
    for key in ['birthYear', 'maritalStatus', 'license']:
        if key in data and (not isinstance(data[key], str) or len(data[key]) > 300):
            raise ValueError('Dados pessoais inválidos.')
    if type(data.get('firstJob')) is not bool:
        raise ValueError('Dados inválidos.')
    import re
    if data['photo'] and not re.fullmatch(r'data:image/jpeg;base64,[A-Za-z0-9+/]+={0,2}', data['photo']):
        raise ValueError('Foto inválida.')
    for kind, keys in {'experiences': ['role', 'company', 'start', 'end', 'description'], 'education': ['course', 'institution', 'status'], 'courses': ['name', 'institution', 'hours', 'year']}.items():
        items = data.get(kind)
        if not isinstance(items, list) or len(items) > 20:
            raise ValueError('Lista inválida.')
        for item in items:
            if not isinstance(item, dict) or any(not isinstance(item.get(k), str) or len(item[k]) > 3000 for k in keys):
                raise ValueError('Item inválido.')
    return data['name'].strip()


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        # Não grave nomes, currículos ou contatos nos logs.
        pass

    def respond(self, code, content, content_type='application/json; charset=utf-8'):
        if not isinstance(content, bytes):
            content = json.dumps(content, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(content)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Referrer-Policy', 'no-referrer')
        self.send_header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'; form-action 'none'; base-uri 'none'")
        self.end_headers()
        self.wfile.write(content)

    def allowed(self, write=False):
        host = self.headers.get('Host', '')
        if host != f'127.0.0.1:{self.server.server_port}':
            self.respond(403, {'error': 'Acesso permitido apenas pelo endereço local do aplicativo.'})
            return False
        origin = self.headers.get('Origin')
        if origin and origin != f'http://{host}':
            self.respond(403, {'error': 'Origem não permitida.'})
            return False
        if self.headers.get('Sec-Fetch-Site') == 'cross-site':
            self.respond(403, {'error': 'Acesso externo não permitido.'})
            return False
        if write and self.headers.get('X-Local-Token') != TOKEN:
            self.respond(403, {'error': 'Reabra o aplicativo para salvar.'})
            return False
        return True

    def do_GET(self):
        if not self.allowed():
            return
        path = urlsplit(self.path).path
        if path in STATIC:
            filename, mime = STATIC[path]
            self.respond(200, (ROOT / filename).read_bytes(), mime)
        elif path == '/api/status':
            self.respond(200, {'database': 'sqlite', 'token': TOKEN})
        elif path == '/api/curriculos':
            with connect() as conn:
                rows = conn.execute('SELECT id, nome, atualizado FROM curriculos ORDER BY atualizado DESC, id DESC').fetchall()
            self.respond(200, [dict(row) for row in rows])
        elif path.startswith('/api/curriculos/') and path.rsplit('/', 1)[-1].isdigit():
            with connect() as conn:
                row = conn.execute('SELECT id, dados FROM curriculos WHERE id = ?', (int(path.rsplit('/', 1)[-1]),)).fetchone()
            self.respond(200, {'id': row['id'], 'document': json.loads(row['dados'])}) if row else self.respond(404, {'error': 'Currículo não encontrado.'})
        else:
            self.respond(404, {'error': 'Página não encontrada.'})

    def do_POST(self):
        if not self.allowed(write=True):
            return
        if urlsplit(self.path).path != '/api/curriculos':
            self.respond(404, {'error': 'Página não encontrada.'})
            return
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= 2 * 1024 * 1024:
                raise ValueError('Arquivo muito grande ou vazio.')
            payload = json.loads(self.rfile.read(length))
            if not isinstance(payload, dict):
                raise ValueError('Dados inválidos.')
            doc = payload.get('document')
            name = validate(doc)
            record_id = payload.get('id')
            if record_id is not None and (type(record_id) is not int or record_id < 1):
                raise ValueError('Identificador inválido.')
            with connect() as conn:
                if record_id is None:
                    cursor = conn.execute('INSERT INTO curriculos (nome, dados) VALUES (?, ?)', (name, json.dumps(doc, ensure_ascii=False)))
                    record_id = cursor.lastrowid
                else:
                    cursor = conn.execute("UPDATE curriculos SET nome=?, dados=?, atualizado=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?", (name, json.dumps(doc, ensure_ascii=False), record_id))
                    if cursor.rowcount == 0:
                        self.respond(404, {'error': 'Currículo não encontrado. Abra novamente a lista.'})
                        return
            self.respond(200, {'id': record_id})
        except (ValueError, UnicodeError):
            self.respond(400, {'error': 'Não foi possível salvar. Confira o nome e os dados do currículo.'})
        except sqlite3.Error:
            self.respond(503, {'error': 'Banco indisponível. Confira espaço em disco e permissão de escrita; tente novamente.'})

    def do_DELETE(self):
        if not self.allowed(write=True):
            return
        path = urlsplit(self.path).path
        if not path.startswith('/api/curriculos/') or not path.rsplit('/', 1)[-1].isdigit():
            self.respond(404, {'error': 'Currículo não encontrado.'})
            return
        with connect() as conn:
            conn.execute('DELETE FROM curriculos WHERE id=?', (int(path.rsplit('/', 1)[-1]),))
        self.respond(200, {'deleted': True})


def main():
    parser = argparse.ArgumentParser(description='Meu Currículo — SQLite local')
    parser.add_argument('--port', type=int, default=0, help='0 escolhe automaticamente uma porta disponível')
    parser.add_argument('--database', default=os.environ.get('CURRICULO_DB', str(Path.home() / 'MeuCurriculo' / 'curriculos.sqlite3')))
    parser.add_argument('--no-browser', action='store_true')
    args = parser.parse_args()
    initialize(args.database)
    with ThreadingHTTPServer(('127.0.0.1', args.port), Handler) as server:
        server.daemon_threads = True
        url = f'http://127.0.0.1:{server.server_port}'
        print(f'Meu Currículo iniciado: {url}', flush=True)
        print(f'Banco local: {DB}\nMantenha esta janela aberta. Para encerrar, pressione Ctrl+C.', flush=True)
        if not args.no_browser:
            threading.Timer(.4, lambda: webbrowser.open(url)).start()
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print('\nAplicativo encerrado.')


if __name__ == '__main__':
    main()
