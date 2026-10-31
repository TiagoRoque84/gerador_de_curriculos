# Meu Currículo

Uma iniciativa da **Roque Consultoria Digital**.

O logo da empresa está incluído em `assets/logo-roque.png` e aparece no cabeçalho e rodapé da interface. A imagem é carregada localmente, inclusive sem internet. Mantenha a pasta `assets` junto aos demais arquivos ao distribuir o sistema.

Esta versão do logo foi preparada com apoio de IA a partir da referência enviada pelo responsável pela marca no chat; não é uma cópia binária do arquivo original do computador. Para usar o arquivo original posteriormente, substitua `assets/logo-roque.png`, mantendo o mesmo nome.

Gerador de currículos em português para ações de extensão e orientação profissional. Perguntas passo a passo, prévia, foto opcional, impressão e PDF. Funciona sem internet e sem cadastro, com um banco SQLite local para consultar e editar os currículos. Não usa bibliotecas externas.

## Como usar

1. No GitHub, clique em **Code → Download ZIP** (ou baixe o ZIP disponibilizado com o projeto).
2. **Extraia todos os arquivos** para uma pasta no computador. Não abra de dentro do ZIP. Mantenha `index.html`, `styles.css`, `app.js`, `servidor.py` e a pasta `assets` juntos.
3. Tenha **Python 3.10 ou mais recente** instalado no computador (no Windows, marque **Add Python to PATH** na instalação). Não é necessário instalar MySQL, pacotes pip ou Node.js para usar o programa.
4. No Windows, dê dois cliques em **Abrir no Windows.bat**. No macOS, use **Abrir no Mac.command**; no Linux, execute `sh "Abrir no Linux.sh"`. Também é possível executar `python3 servidor.py` (Windows: `py -3 servidor.py`). O navegador abre automaticamente. Mantenha a janela do servidor aberta durante o uso. Se o navegador não abrir, copie o endereço mostrado no terminal.
5. Clique em **Criar meu currículo** e siga as perguntas. Os campos opcionais podem ficar em branco. Inclua experiências e formações da mais recente para a mais antiga.
6. Na última etapa, clique em **Imprimir ou salvar em PDF**. Para PDF, escolha **Salvar como PDF** ou **Microsoft Print to PDF** na janela do navegador. Para papel, escolha a impressora instalada. Use A4 e desative os cabeçalhos e rodapés do navegador.

Não é necessário manter a internet ligada após baixar. Use uma versão atual de Chrome, Edge ou Firefox. O navegador controla a impressão e o destino do PDF; a janela pode variar entre computadores. Revise a prévia de todas as páginas antes de salvar. O sistema limita a impressão a **uma folha A4**, ajustando a fonte entre 11 e 9 pontos. Se ainda houver conteúdo demais, a impressão é bloqueada e o usuário recebe orientação para resumir. Use escala 100% e margens padrão da aplicação. Impressoras, drivers e configurações do navegador podem alterar o resultado: confira a prévia no computador de destino.

## Banco SQLite: consultar e editar depois

Clique em **Salvar no computador** para cadastrar o currículo. Depois, use **Consultar salvos**, busque pelo nome e clique em **Editar**. Ao salvar novamente, o mesmo cadastro é atualizado. Para outra pessoa, use **Começar outro currículo**. Cadastros também podem ser excluídos, com confirmação.

O arquivo do banco fica na pasta do usuário: `MeuCurriculo/curriculos.sqlite3` (no Windows, normalmente `C:\Users\SeuUsuario\MeuCurriculo\curriculos.sqlite3`). O arquivo contém os currículos e as fotos, sem criptografia. Não é enviado ao GitHub. Cada conta do sistema operacional tem seu próprio banco; pessoas que usam a mesma conta podem consultar todos os cadastros. Não há login interno nem sincronização entre computadores.

Para fazer backup, encerre o aplicativo e copie `curriculos.sqlite3` para um local seguro. Para restaurar, com o aplicativo fechado, substitua o arquivo pelo backup. Guarde uma cópia do arquivo atual antes de substituir. Use `--database CAMINHO` ou a variável `CURRICULO_DB` para escolher outro local de banco. Faça backup antes de atualizar o programa; extraia novas versões em outra pasta. O banco fica separado do programa.

O servidor atende **apenas em 127.0.0.1**, com porta escolhida automaticamente, sem acesso por rede externa. Não exponha esse servidor na internet. Encerre com Ctrl+C ou feche a janela do terminal.

## Alternativa sem Python e arquivo de edição

É possível abrir `index.html` diretamente para preencher e imprimir, sem banco. Nessa modalidade, use os arquivos JSON para continuar depois. Não há instalação de dependências. Algumas políticas de navegadores corporativos bloqueiam arquivos locais; nesse caso, use o iniciador com Python.

**Baixar arquivo de edição** baixa um arquivo `meu-curriculo-para-editar.json`. Para recuperar, clique em **Continuar de um arquivo salvo** na tela inicial ou **Abrir arquivo salvo** nas etapas. O JSON é para edição; o PDF é para enviar ou imprimir.

As edições ficam na memória da página até você salvar no banco ou baixar um arquivo. Não usamos cookies, armazenamento automático, rastreamento, serviços externos nem fontes da internet. Fechar ou recarregar a página descarta os dados não salvos. O navegador pode pedir confirmação ao sair. A foto é reduzida localmente e o currículo usa um recorte central; confira o resultado na prévia.

**Em computadores compartilhados:** depois de imprimir, use **Começar outro currículo**, exclua da consulta os cadastros que não devem ser retidos, feche a página e remova os arquivos JSON/PDF/fotos dos downloads e da lixeira, conforme a autorização de quem usou. Os arquivos salvos contêm dados pessoais e não são criptografados. O botão de reinício apaga apenas os dados da tela. O histórico de impressão e os arquivos do sistema são administrados pelo computador. Peça consentimento antes de usar foto e dados de participantes.

## O que está incluído

- Ano de nascimento, estado civil e habilitação (A, B, AB, C, AC, D, AD, E ou AE), opcionais e incluídos na impressão quando preenchidos. Arquivos antigos continuam compatíveis.
- Impressão sem margens do navegador, com espaçamento interno para preservar o layout. Caso o navegador ainda acrescente data, título ou caminho do arquivo, desmarque **Cabeçalhos e rodapés** em **Mais configurações** na janela de impressão.
- Nome, cidade, estado e contatos. Nome e pelo menos um telefone ou e-mail são obrigatórios.
- Objetivo profissional obrigatório e resumo opcional.
- Várias experiências, formações e cursos, com opção de primeiro emprego.
- Habilidades, idiomas e informações adicionais.
- Foto opcional em JPG, PNG ou WebP, processada no próprio computador.
- Prévia e currículo para impressão em A4, com seções vazias omitidas.
- Banco SQLite com consulta por nome, edição e exclusão.
- Exportação e importação de arquivo de edição, com verificação de formato.

A estrutura segue as seções do documento “Modelo de Currículo” fornecido para o projeto. Dados de exemplo são apenas sugestões nos campos e não entram no currículo.

## Desenvolvimento e validação

Execute `python3 servidor.py` e edite `app.js`, `styles.css` ou `servidor.py`. Não há dependências externas, build ou chaves de API. Use o checkout existente; não é necessário criar worktree. Para desenvolvimento isolado, use `python3 servidor.py --database /tmp/curriculos-dev.sqlite3 --no-browser`.

Verificação de sintaxe (Node.js):

```sh
node --check app.js
```

Teste funcional automatizado com Python 3.10+, Chromium, `pdfinfo`, `pdftotext` e Node.js 22 ou mais recente, sem pacotes npm:

```sh
node tests/smoke.cjs
```

No Linux, o teste procura `chromium`; para outra instalação, defina `CHROMIUM_PATH`. O teste tenta abrir via `file://` e usa o servidor local quando a política do Chromium bloqueia arquivos locais. Percorre etapas, valida campos, foto, importação/exportação, banco persistente e PDF de uma folha. Usa dados fictícios e banco temporário. Arquivos temporários ficam fora do projeto. A confirmação visual e a impressão em uma impressora física devem ser feitas no computador de destino.

## Publicar os arquivos no GitHub

Adicione os arquivos deste projeto ao repositório e faça um commit. Não publique currículos preenchidos, fotos ou arquivos JSON de participantes. O sistema também funciona quando o ZIP é distribuído por pendrive.
