# ✂️ Prime Barber - MVP

Sistema de agendamento online para barbearias com múltiplas unidades.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)

## 📱 Screenshots

| Home | Agendamento | Dashboard |
|------|-------------|-----------|
| Hero com CTA | Fluxo 5 etapas | Área do cliente |

## 🚀 Setup Rápido

### 1. Clone e Configure o Projeto

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/prime-barber.git
cd prime-barber

# Crie o arquivo de configuração
cp config.example.js config.js
```

### 2. Configure as Credenciais

Edite o arquivo `config.js` com suas credenciais:

```javascript
const CONFIG = {
    supabase: {
        url: 'https://SEU_PROJETO.supabase.co',      // Project URL
        anonKey: 'SUA_ANON_KEY_AQUI'                 // anon public key
    },
    app: {
        name: 'Prime Barber',
        businessHours: { start: 9, end: 19 },       // Horário: 09h às 19h
        closedDays: [0],                             // Fechado: Domingo
        slotInterval: 30                             // Intervalos de 30min
    },
    // ... demais configurações
};
```

#### 📋 Onde encontrar as credenciais do Supabase:

1. Acesse [app.supabase.com](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Settings** (⚙️) → **API**
4. Copie:
   - **Project URL** → `supabase.url`
   - **anon public** (em Project API keys) → `supabase.anonKey`

> ⚠️ **IMPORTANTE**: O arquivo `config.js` contém credenciais sensíveis e já está no `.gitignore`. Nunca commite este arquivo!

### 3. Configure o Supabase

#### 3.1 Crie as Tabelas

Execute o SQL abaixo no **SQL Editor** do Supabase:

```sql
-- ===========================================
-- PRIME BARBER - Schema do Banco de Dados
-- ===========================================

-- Extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- TABELA: profiles (extensão do auth.users)
-- ===========================================
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name VARCHAR(255),
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'barber', 'admin')),
    preferred_unit_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para criar profile automaticamente
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ===========================================
-- TABELA: units (unidades/lojas)
-- ===========================================
CREATE TABLE units (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(500),
    city VARCHAR(100),
    photo_url VARCHAR(500), -- Caminho no Storage: units/{id}/main.jpg
    phone VARCHAR(20),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- TABELA: services (serviços oferecidos)
-- ===========================================
CREATE TABLE services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    price_cents INTEGER NOT NULL, -- Preço em centavos (R$ 35,00 = 3500)
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- TABELA: unit_services (N:N - serviços por unidade)
-- ===========================================
CREATE TABLE unit_services (
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    PRIMARY KEY (unit_id, service_id)
);

-- ===========================================
-- TABELA: barbers (barbeiros)
-- ===========================================
CREATE TABLE barbers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    bio TEXT,
    avatar_url VARCHAR(500), -- Caminho no Storage: barbers/{id}/avatar.jpg
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- TABELA: barber_units (N:N - barbeiros por unidade)
-- ===========================================
CREATE TABLE barber_units (
    barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
    PRIMARY KEY (barber_id, unit_id)
);

-- ===========================================
-- TABELA: appointments (agendamentos)
-- ===========================================
CREATE TABLE appointments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    barber_id UUID REFERENCES barbers(id) ON DELETE SET NULL,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    start_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_appointments_customer ON appointments(customer_id);
CREATE INDEX idx_appointments_barber ON appointments(barber_id);
CREATE INDEX idx_appointments_unit ON appointments(unit_id);
CREATE INDEX idx_appointments_start_time ON appointments(start_time);
CREATE INDEX idx_appointments_status ON appointments(status);

-- ===========================================
-- RLS (Row Level Security)
-- ===========================================

-- Habilita RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE barber_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Políticas de profiles
CREATE POLICY "Profiles são visíveis para usuários autenticados"
    ON profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Usuários podem atualizar próprio perfil"
    ON profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Service role pode tudo em profiles"
    ON profiles FOR ALL
    TO service_role
    USING (true);

-- Políticas de units (leitura pública)
CREATE POLICY "Units são públicas para leitura"
    ON units FOR SELECT
    TO anon, authenticated
    USING (active = true);

-- Políticas de services (leitura pública)
CREATE POLICY "Services são públicos para leitura"
    ON services FOR SELECT
    TO anon, authenticated
    USING (active = true);

-- Políticas de unit_services (leitura pública)
CREATE POLICY "Unit_services são públicos para leitura"
    ON unit_services FOR SELECT
    TO anon, authenticated
    USING (true);

-- Políticas de barbers (leitura pública)
CREATE POLICY "Barbers são públicos para leitura"
    ON barbers FOR SELECT
    TO anon, authenticated
    USING (active = true);

-- Políticas de barber_units (leitura pública)
CREATE POLICY "Barber_units são públicos para leitura"
    ON barber_units FOR SELECT
    TO anon, authenticated
    USING (true);

-- Políticas de appointments
CREATE POLICY "Usuários podem ver próprios agendamentos"
    ON appointments FOR SELECT
    TO authenticated
    USING (customer_id = auth.uid());

CREATE POLICY "Barbeiros podem ver agendamentos de suas unidades"
    ON appointments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM barbers b
            JOIN barber_units bu ON b.id = bu.barber_id
            WHERE b.profile_id = auth.uid()
            AND bu.unit_id = appointments.unit_id
        )
    );

CREATE POLICY "Admins podem ver todos agendamentos"
    ON appointments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Usuários autenticados podem criar agendamentos"
    ON appointments FOR INSERT
    TO authenticated
    WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Barbeiros e admins podem atualizar agendamentos"
    ON appointments FOR UPDATE
    TO authenticated
    USING (
        customer_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM barbers b
            WHERE b.profile_id = auth.uid()
            AND b.id = appointments.barber_id
        )
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

#### 3.2 Crie o Bucket de Imagens

1. No Supabase, vá em **Storage**
2. Clique em **New bucket**
3. Nome: `barbershop-images`
4. ✅ Marque **Public bucket**
5. Crie as pastas: `units/` e `barbers/`

#### 3.3 Insira Dados de Exemplo

```sql
-- ===========================================
-- DADOS DE EXEMPLO
-- ===========================================

-- Unidades
INSERT INTO units (id, name, address, city, photo_url) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Prime Barber Centro', 'Rua Augusta, 1500', 'São Paulo', 'units/centro/main.jpg'),
    ('22222222-2222-2222-2222-222222222222', 'Prime Barber Jardins', 'Av. Brasil, 800', 'São Paulo', 'units/jardins/main.jpg');

-- Serviços
INSERT INTO services (id, name, duration_minutes, price_cents) VALUES
    ('aaaa1111-1111-1111-1111-111111111111', 'Corte Masculino', 30, 3500),
    ('aaaa2222-2222-2222-2222-222222222222', 'Barba', 20, 2500),
    ('aaaa3333-3333-3333-3333-333333333333', 'Combo (Corte + Barba)', 45, 5500),
    ('aaaa4444-4444-4444-4444-444444444444', 'Corte Degradê', 40, 4500),
    ('aaaa5555-5555-5555-5555-555555555555', 'Hidratação', 30, 3000);

-- Vincular serviços às unidades
INSERT INTO unit_services (unit_id, service_id) VALUES
    ('11111111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111'),
    ('11111111-1111-1111-1111-111111111111', 'aaaa2222-2222-2222-2222-222222222222'),
    ('11111111-1111-1111-1111-111111111111', 'aaaa3333-3333-3333-3333-333333333333'),
    ('11111111-1111-1111-1111-111111111111', 'aaaa4444-4444-4444-4444-444444444444'),
    ('22222222-2222-2222-2222-222222222222', 'aaaa1111-1111-1111-1111-111111111111'),
    ('22222222-2222-2222-2222-222222222222', 'aaaa2222-2222-2222-2222-222222222222'),
    ('22222222-2222-2222-2222-222222222222', 'aaaa3333-3333-3333-3333-333333333333'),
    ('22222222-2222-2222-2222-222222222222', 'aaaa5555-5555-5555-5555-555555555555');
```

### 4. Suba as Imagens

No Storage, dentro de `barbershop-images`:
- `units/centro/main.jpg` - Foto da unidade Centro
- `units/jardins/main.jpg` - Foto da unidade Jardins
- `barbers/joao/avatar.jpg` - Avatar do barbeiro João
- `barbers/pedro/avatar.jpg` - Avatar do barbeiro Pedro

### 5. Execute Localmente

**Opção A - Python:**
```bash
python -m http.server 8000
```

**Opção B - Node.js:**
```bash
npx serve .
```

**Opção C - VS Code:**
- Instale a extensão "Live Server"
- Clique direito em `index.html` > "Open with Live Server"

Acesse: `http://localhost:8000`

---

## 📁 Estrutura de Arquivos

```
prime-barber/
├── index.html              # App principal (SPA)
├── config.js               # ⚠️ Credenciais (não commitar!)
├── config.example.js       # Template de configuração
├── .gitignore              # Arquivos ignorados pelo Git
├── README.md               # Esta documentação
│
├── css/
│   └── styles.css          # Estilos mobile-first
│
├── js/
│   ├── app.js              # Lógica de navegação e agendamento
│   ├── supabaseClient.js   # Cliente Supabase + funções CRUD
│   └── trinksStub.js       # Stubs para Trinks/N8N
│
└── assets/
    └── images/             # Imagens locais (logo, ícones, etc.)
```

### Arquivos de Configuração

| Arquivo | Descrição | Git |
|---------|-----------|-----|
| `config.js` | Credenciais reais do projeto | ❌ Ignorado |
| `config.example.js` | Template para novos devs | ✅ Commitado |
| `.gitignore` | Lista de arquivos ignorados | ✅ Commitado |

---

## ⚙️ Configurações Disponíveis

O arquivo `config.js` permite configurar:

```javascript
const CONFIG = {
    // Supabase
    supabase: {
        url: '...',           // URL do projeto
        anonKey: '...'        // Chave anônima
    },
    
    // Aplicação
    app: {
        name: 'Prime Barber',
        businessHours: {
            start: 9,         // Abre às 9h
            end: 19           // Fecha às 19h
        },
        closedDays: [0],      // 0=Dom, 1=Seg, ..., 6=Sáb
        slotInterval: 30      // Intervalos de 30min
    },
    
    // Trinks (integração futura)
    trinks: {
        enabled: false,       // Ativar/desativar
        baseUrl: '...',
        apiToken: '...',
        establishmentId: '...'
    },
    
    // N8N (automações futuras)
    n8n: {
        enabled: false,       // Ativar/desativar
        baseUrl: '...',
        webhooks: { ... }
    },
    
    // Storage
    storage: {
        bucket: 'barbershop-images',
        paths: {
            units: 'units',
            barbers: 'barbers'
        }
    }
};
```

---

## 📊 Estrutura de Dados

### Relacionamentos

```
profiles ←── appointments ──→ barbers
    │              │             │
    │              │             │
    ↓              ↓             ↓
  auth.users    services      units
                   │             │
                   └─────────────┘
                   unit_services
```

### Storage

```
barbershop-images/
├── units/
│   ├── {unit_id}/main.jpg
│   └── ...
└── barbers/
    ├── {barber_id}/avatar.jpg
    └── ...
```

---

## 🎨 Customização

### Cores

Edite as variáveis CSS em `css/styles.css`:

```css
:root {
    --color-primary: #c9a227;      /* Dourado/Âmbar */
    --color-bg: #0d0d0d;           /* Fundo escuro */
    --color-text: #f5f5f5;         /* Texto claro */
    /* ... */
}
```

### Logo

Substitua o ícone e texto no header em `index.html`:

```html
<a href="#" class="logo">
    <span class="logo-icon">✂</span>
    <span class="logo-text">PRIME<span class="logo-accent">BARBER</span></span>
</a>
```

### Horário e Dias de Funcionamento

Configure em `config.js`:

```javascript
app: {
    businessHours: {
        start: 8,     // Abre às 8h
        end: 20       // Fecha às 20h
    },
    closedDays: [0, 6],  // Fechado Domingo e Sábado
    slotInterval: 30     // Intervalos de 30min
}
```

---

## 🔌 Integrações Futuras

### Trinks

1. Configure em `config.js`:
```javascript
trinks: {
    enabled: true,
    baseUrl: 'https://api.trinks.com/v1',
    apiToken: 'SEU_TOKEN',
    establishmentId: 'SEU_ID'
}
```

2. Implemente as funções em `js/trinksStub.js`
3. Descomente as chamadas em `js/supabaseClient.js`

### N8N (Automações)

1. Configure webhooks no N8N
2. Atualize em `config.js`:
```javascript
n8n: {
    enabled: true,
    baseUrl: 'https://seu-n8n.com',
    webhooks: {
        newAppointment: '/webhook/novo-agendamento',
        // ...
    }
}
```

### Exemplos de Workflows N8N

- **Confirmação por WhatsApp**: Webhook → Format Message → WhatsApp Business API
- **Lembrete 24h antes**: Schedule Trigger → Query DB → Filter → Send Message
- **Avaliação pós-atendimento**: Webhook → Wait 2h → Send Email

---

## 🚀 Deploy

### Netlify

1. Crie repositório no GitHub
2. Conecte ao Netlify
3. Configure:
   - Build command: (vazio)
   - Publish directory: `.`
4. Adicione variáveis de ambiente se necessário

### Vercel

```bash
npm i -g vercel
vercel
```

### GitHub Pages

1. Settings > Pages
2. Source: Deploy from branch
3. Branch: main, folder: / (root)

> ⚠️ **Nota**: Para deploy, você precisará de uma forma de injetar as credenciais. Considere usar variáveis de ambiente ou um build script.

---

## 📱 PWA (Opcional)

Para transformar em PWA, adicione:

1. `manifest.json`
2. Service Worker
3. Ícones em diferentes tamanhos

---

## 🔐 Segurança

- ✅ RLS habilitado em todas as tabelas
- ✅ Credenciais isoladas em `config.js` (gitignored)
- ✅ Tokens seguros via Supabase Auth
- ⚠️ Em produção, configure CORS adequadamente
- ⚠️ Valide inputs no servidor (Edge Functions)

---

## 🐛 Troubleshooting

### "CONFIG não definido"
- Verifique se `config.js` existe (copie de `config.example.js`)
- Confirme que `config.js` está sendo carregado antes dos outros scripts

### "Erro ao carregar dados"
- Verifique se as credenciais em `config.js` estão corretas
- Confirme que as tabelas foram criadas no Supabase
- Verifique o console do navegador para erros específicos

### Imagens não aparecem
- Confirme que o bucket `barbershop-images` é público
- Verifique os caminhos no banco (`photo_url`, `avatar_url`)
- Use caminhos relativos (sem URL completa)

### Login não funciona
- Habilite "Email Auth" em Authentication > Providers
- Para testes, desabilite "Confirm email" em Settings

---

## 👥 Para Novos Desenvolvedores

1. Clone o repositório
2. Copie `config.example.js` para `config.js`
3. Preencha as credenciais do Supabase
4. Siga as instruções de Setup acima
5. Execute `python -m http.server 8000`

---

## 📝 Licença

MIT License - Use livremente para projetos pessoais e comerciais.

---

Desenvolvido com 💈 para barbearias modernas.
