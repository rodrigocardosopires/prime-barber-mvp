/**
 * PRIME BARBER - Trinks & N8N Integration Stubs
 * 
 * Este arquivo contém stubs (funções placeholder) para futuras integrações:
 * - Trinks: Sistema de gestão para barbearias/salões
 * - N8N: Plataforma de automação de workflows
 * 
 * COMO USAR:
 * 1. Configure as credenciais em config.js
 * 2. Implemente as funções conforme documentação das APIs
 * 3. Descomente as chamadas no supabaseClient.js
 * 
 * ⚠️  Requer: config.js carregado antes deste arquivo
 */

// ============================================
// CONFIGURAÇÃO (via config.js)
// ============================================

// Obtém configurações do config.js global
const TRINKS_CONFIG = CONFIG?.trinks || {
    enabled: false,
    baseUrl: '',
    apiToken: '',
    establishmentId: ''
};

const N8N_CONFIG = CONFIG?.n8n || {
    enabled: false,
    baseUrl: '',
    webhooks: {}
};

// ============================================
// TRINKS - FUNÇÕES DE INTEGRAÇÃO
// ============================================

/**
 * Sincroniza um agendamento local com o Trinks
 * @param {Object} appointment - Dados do agendamento
 * @returns {Promise<Object>} Resposta da API Trinks
 * 
 * DOCUMENTAÇÃO TRINKS:
 * - Endpoint: POST /appointments
 * - Requer mapeamento de IDs locais → IDs Trinks
 */
async function syncAppointmentToTrinks(appointment) {
    console.log('🔗 [STUB] syncAppointmentToTrinks:', appointment);
    
    // FUTURO: Implementar chamada real
    /*
    const trinksPayload = {
        establishment_id: TRINKS_CONFIG.establishmentId,
        professional_id: mapBarberIdToTrinks(appointment.barber_id),
        service_id: mapServiceIdToTrinks(appointment.service_id),
        customer: {
            name: appointment.customer_name,
            phone: appointment.customer_phone,
            email: appointment.customer_email
        },
        scheduled_at: appointment.start_time,
        notes: `Agendamento via Prime Barber App - ID: ${appointment.id}`
    };

    const response = await fetch(`${TRINKS_CONFIG.baseUrl}/appointments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TRINKS_CONFIG.apiToken}`
        },
        body: JSON.stringify(trinksPayload)
    });

    if (!response.ok) {
        throw new Error(`Trinks API Error: ${response.status}`);
    }

    return await response.json();
    */
    
    return { success: true, trinks_id: 'STUB_ID' };
}

/**
 * Cancela um agendamento no Trinks
 * @param {string} trinksAppointmentId - ID do agendamento no Trinks
 * @returns {Promise<Object>} Resposta da API
 */
async function cancelAppointmentInTrinks(trinksAppointmentId) {
    console.log('🔗 [STUB] cancelAppointmentInTrinks:', trinksAppointmentId);
    
    // FUTURO: Implementar chamada real
    /*
    const response = await fetch(`${TRINKS_CONFIG.baseUrl}/appointments/${trinksAppointmentId}/cancel`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${TRINKS_CONFIG.apiToken}`
        }
    });

    if (!response.ok) {
        throw new Error(`Trinks API Error: ${response.status}`);
    }

    return await response.json();
    */
    
    return { success: true };
}

/**
 * Busca disponibilidade de um profissional no Trinks
 * @param {string} professionalId - ID do profissional no Trinks
 * @param {string} date - Data no formato YYYY-MM-DD
 * @returns {Promise<Array>} Horários disponíveis
 */
async function getTrinksAvailability(professionalId, date) {
    console.log('🔗 [STUB] getTrinksAvailability:', { professionalId, date });
    
    // FUTURO: Implementar chamada real
    /*
    const response = await fetch(
        `${TRINKS_CONFIG.baseUrl}/professionals/${professionalId}/availability?date=${date}`,
        {
            headers: {
                'Authorization': `Bearer ${TRINKS_CONFIG.apiToken}`
            }
        }
    );

    if (!response.ok) {
        throw new Error(`Trinks API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.available_slots;
    */
    
    return [
        { start: '09:00', end: '09:30' },
        { start: '10:00', end: '10:30' },
        { start: '14:00', end: '14:30' }
    ];
}

/**
 * Mapeia ID de barbeiro local para ID no Trinks
 * @param {string} localBarberId - ID local do barbeiro
 * @returns {string} ID no Trinks
 * 
 * NOTA: Requer tabela de mapeamento no Supabase ou config local
 */
function mapBarberIdToTrinks(localBarberId) {
    // FUTURO: Implementar mapeamento real
    const mapping = {
        // 'local-id': 'trinks-id'
    };
    return mapping[localBarberId] || localBarberId;
}

/**
 * Mapeia ID de serviço local para ID no Trinks
 * @param {string} localServiceId - ID local do serviço
 * @returns {string} ID no Trinks
 */
function mapServiceIdToTrinks(localServiceId) {
    // FUTURO: Implementar mapeamento real
    const mapping = {
        // 'local-id': 'trinks-id'
    };
    return mapping[localServiceId] || localServiceId;
}

// ============================================
// N8N - FUNÇÕES DE WEBHOOK
// ============================================

/**
 * Dispara um webhook no N8N
 * @param {string} event - Nome do evento
 * @param {Object} data - Dados a enviar
 * @returns {Promise<Object>} Resposta do webhook
 */
async function triggerN8nWebhook(event, data) {
    console.log('🔗 [STUB] triggerN8nWebhook:', { event, data });
    
    const webhookPath = N8N_CONFIG.webhooks[event];
    
    if (!webhookPath) {
        console.warn(`Webhook não configurado para evento: ${event}`);
        return { success: false, error: 'Webhook não configurado' };
    }
    
    // FUTURO: Implementar chamada real
    /*
    try {
        const response = await fetch(`${N8N_CONFIG.baseUrl}${webhookPath}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                event,
                timestamp: new Date().toISOString(),
                data
            })
        });

        if (!response.ok) {
            throw new Error(`N8N Webhook Error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Erro ao disparar webhook N8N:', error);
        // Não propaga erro para não interromper fluxo principal
        return { success: false, error: error.message };
    }
    */
    
    return { success: true, message: 'Webhook stub executado' };
}

/**
 * Dispara notificação de novo agendamento
 * @param {Object} appointment - Dados do agendamento
 */
async function notifyNewAppointment(appointment) {
    return triggerN8nWebhook('newAppointment', {
        appointment_id: appointment.id,
        customer_name: appointment.customer_name,
        customer_email: appointment.customer_email,
        customer_phone: appointment.customer_phone,
        service_name: appointment.service_name,
        barber_name: appointment.barber_name,
        unit_name: appointment.unit_name,
        scheduled_at: appointment.start_time,
        // Dados para templates de mensagem
        formatted_date: new Date(appointment.start_time).toLocaleDateString('pt-BR'),
        formatted_time: new Date(appointment.start_time).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        })
    });
}

/**
 * Dispara lembrete de agendamento
 * @param {Object} appointment - Dados do agendamento
 * @param {number} hoursBeforehoursUntil - Horas até o agendamento
 */
async function sendAppointmentReminder(appointment, hoursUntil) {
    return triggerN8nWebhook('appointmentReminder', {
        appointment_id: appointment.id,
        customer_name: appointment.customer_name,
        customer_phone: appointment.customer_phone,
        hours_until: hoursUntil,
        service_name: appointment.service_name,
        barber_name: appointment.barber_name,
        unit_name: appointment.unit_name,
        unit_address: appointment.unit_address,
        scheduled_at: appointment.start_time
    });
}

/**
 * Dispara notificação de cancelamento
 * @param {Object} appointment - Dados do agendamento
 * @param {string} reason - Motivo do cancelamento
 */
async function notifyAppointmentCancelled(appointment, reason = '') {
    return triggerN8nWebhook('appointmentCancelled', {
        appointment_id: appointment.id,
        customer_name: appointment.customer_name,
        customer_email: appointment.customer_email,
        service_name: appointment.service_name,
        scheduled_at: appointment.start_time,
        cancellation_reason: reason
    });
}

/**
 * Dispara notificação de conclusão de atendimento
 * @param {Object} appointment - Dados do agendamento
 */
async function notifyAppointmentCompleted(appointment) {
    return triggerN8nWebhook('appointmentCompleted', {
        appointment_id: appointment.id,
        customer_name: appointment.customer_name,
        customer_email: appointment.customer_email,
        service_name: appointment.service_name,
        barber_name: appointment.barber_name,
        // Pode incluir link para avaliação
        review_link: `${window.location.origin}/avaliar/${appointment.id}`
    });
}

// ============================================
// UTILIDADES PARA INTEGRAÇÃO
// ============================================

/**
 * Formata telefone para WhatsApp
 * @param {string} phone - Telefone no formato brasileiro
 * @returns {string} Telefone formatado para API WhatsApp
 */
function formatPhoneForWhatsApp(phone) {
    // Remove tudo que não é número
    const numbers = phone.replace(/\D/g, '');
    
    // Adiciona código do país se não tiver
    if (numbers.length === 11) {
        return `55${numbers}`;
    } else if (numbers.length === 10) {
        return `559${numbers}`; // Adiciona 9 se for celular antigo
    }
    
    return numbers;
}

/**
 * Gera mensagem de confirmação para WhatsApp
 * @param {Object} appointment - Dados do agendamento
 * @returns {string} Mensagem formatada
 */
function generateWhatsAppConfirmation(appointment) {
    const date = new Date(appointment.start_time).toLocaleDateString('pt-BR');
    const time = new Date(appointment.start_time).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    return `
✂️ *Prime Barber*

Olá ${appointment.customer_name}!

Seu agendamento foi confirmado:

📅 *Data:* ${date}
🕐 *Horário:* ${time}
💈 *Serviço:* ${appointment.service_name}
👤 *Barbeiro:* ${appointment.barber_name}
📍 *Local:* ${appointment.unit_name}

Até lá! 🙂
    `.trim();
}

/**
 * Gera link para WhatsApp com mensagem
 * @param {string} phone - Telefone
 * @param {string} message - Mensagem
 * @returns {string} URL do WhatsApp
 */
function generateWhatsAppLink(phone, message) {
    const formattedPhone = formatPhoneForWhatsApp(phone);
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}

// ============================================
// EXPORTS
// ============================================

window.TrinksIntegration = {
    // Trinks
    syncAppointmentToTrinks,
    cancelAppointmentInTrinks,
    getTrinksAvailability,
    mapBarberIdToTrinks,
    mapServiceIdToTrinks,
    
    // N8N
    triggerN8nWebhook,
    notifyNewAppointment,
    sendAppointmentReminder,
    notifyAppointmentCancelled,
    notifyAppointmentCompleted,
    
    // Utilitários
    formatPhoneForWhatsApp,
    generateWhatsAppConfirmation,
    generateWhatsAppLink,
    
    // Config (para debug)
    config: {
        trinks: TRINKS_CONFIG,
        n8n: N8N_CONFIG
    }
};

console.log('✅ Trinks & N8N Stubs carregados');
if (!TRINKS_CONFIG.enabled && !N8N_CONFIG.enabled) {
    console.log('ℹ️  Integrações desabilitadas. Configure em config.js para ativar.');
}

