# DECIFRA

Jogo diário de adivinhação de palavras de 5 letras (inspirado no Termo/Wordle), desenvolvido como aplicação fullstack com foco em arquitetura backend, persistência de estado em banco relacional e testes automatizados.

🔗 **Acesse o jogo online:** [https://decifra-3j43.onrender.com](https://decifra-3j43.onrender.com)  
*(No plano gratuito do Render, o primeiro acesso após inatividade pode levar alguns segundos para iniciar o servidor.)*

---

## ✨ Funcionalidades

- **Autenticação com JWT:** cadastro e login com senha criptografada (`bcrypt`) e proteção de rotas via Bearer Token.
- **Palavra do dia com fuso horário brasileiro:** seleção diária baseada em `America/Sao_Paulo`, garantindo a virada da palavra à meia-noite no Brasil.
- **Persistência e restauração de partida:** o progresso do jogador é salvo no PostgreSQL a cada tentativa; recarregar a página restaura o tabuleiro exatamente de onde parou.
- **Validação completa no backend:** controle de limite de 6 tentativas, encerramento automático da partida (`playing`, `won`, `lost`) e cálculo de feedback por letra (`correct`, `present`, `absent`).
- **Interface responsiva:** suporte a teclado físico e teclado virtual QWERTY com feedback visual em tempo real.
- **Compartilhamento em imagem (PNG):** geração de card com o resultado da partida via HTML5 Canvas (sem spoilers), com suporte a Web Share API, cópia para área de transferência e download.

---

## 🛠️ Tecnologias Utilizadas

**Backend**
- Node.js & TypeScript
- Express
- PostgreSQL (Neon) & `pg`
- JSON Web Token (`jsonwebtoken`) & `bcrypt`

**Frontend**
- React, TypeScript & Vite
- Tailwind CSS
- HTML5 Canvas API

**Testes & Deploy**
- **Backend:** Jest & Supertest
- **Frontend:** Vitest & React Testing Library
- **Deploy:** Render (Web Service único servindo a API e o build estático do React)

---

## 📡 Principais Endpoints da API

| Método | Rota | Autenticação | Descrição |
| :--- | :--- | :---: | :--- |
| `POST` | `/adduser` | Não | Cria um novo usuário (`username`, `password`) |
| `POST` | `/login` | Não | Autentica o usuário e retorna o token JWT |
| `GET` | `/game/findtodaygame` | JWT | Busca ou cria a partida do dia e retorna tentativas anteriores |
| `POST` | `/game/guess` | JWT | Envia um palpite de 5 letras, retorna feedback e atualiza o status |

---

## 🚀 Como rodar localmente

### 1. Clone o repositório
```bash
git clone [https://github.com/gjbaltieri/decifra.git](https://github.com/gjbaltieri/decifra.git)
cd decifra
