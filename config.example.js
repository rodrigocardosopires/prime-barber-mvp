/**
 * PRIME BARBER - Configurações do Projeto (EXEMPLO)
 * 
 * 📋 INSTRUÇÕES:
 *    1. Copie este arquivo para config.js
 *    2. Substitua os valores com suas credenciais
 *    3. O arquivo config.js já está no .gitignore
 * 
 * 💡 DICA: No Supabase, vá em Settings > API para obter URL e anon key
 */

const CONFIG = {
    // ===========================================
    // SUPABASE
    // ===========================================
    supabase: {
        // URL do projeto: https://app.supabase.com > Settings > API > Project URL
        url: 'https://xxxxxxxxxx.supabase.co',
        
        // Anon Key: Settings > API > anon public
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    },

    // ===========================================
    // APLICAÇÃO
    // ===========================================
    app: {
        name: 'Prime Barber',
        // Horário de funcionamento (formato 24h)
        businessHours: {
            start: 9,  // 09:00
            end: 19    // 19:00
        },
        // Dias de fechamento (0 = Domingo, 1 = Segunda, ..., 6 = Sábado)
        closedDays: [0], // Fechado aos domingos
        // Intervalo entre horários disponíveis (minutos)
        slotInterval: 30
    },

    // ===========================================
    // TRINKS (Integração futura)
    // ===========================================
    trinks: {
        enabled: false, // Mude para true quando configurar
        baseUrl: 'https://api.trinks.com/v1',
        apiToken: 'SEU_TOKEN_TRINKS',
        establishmentId: 'SEU_ESTABLISHMENT_ID'
    },

    // ===========================================
    // N8N (Automações futuras)
    // ===========================================
    n8n: {
        enabled: false, // Mude para true quando configurar
        baseUrl: 'https://seu-n8n.exemplo.com',
        webhooks: {
            newAppointment: '/webhook/novo-agendamento',
            appointmentCancelled: '/webhook/agendamento-cancelado',
            appointmentCompleted: '/webhook/agendamento-concluido',
            appointmentReminder: '/webhook/lembrete-agendamento',
            customerCreated: '/webhook/novo-cliente'
        }
    },

    // ===========================================
    // STORAGE
    // ===========================================
    storage: {
        bucket: 'barbershop-images',
        paths: {
            units: 'units',
            barbers: 'barbers'
        }
    }
};

// Exporta para uso global
window.CONFIG = CONFIG;

