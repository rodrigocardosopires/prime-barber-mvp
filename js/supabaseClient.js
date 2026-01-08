/**
 * PRIME BARBER - Supabase Client
 * Configuração e funções CRUD para integração com Supabase
 * 
 * ⚠️  Requer: config.js carregado antes deste arquivo
 */

// ============================================
// CONFIGURAÇÃO SUPABASE
// ============================================

// Valida se config.js foi carregado
if (typeof CONFIG === 'undefined') {
    console.error('❌ ERRO: config.js não foi carregado!');
    console.error('   Verifique se config.js existe e está sendo importado antes de supabaseClient.js');
    throw new Error('CONFIG não definido. Copie config.example.js para config.js');
}

// Obtém credenciais do config.js
const SUPABASE_URL = CONFIG.supabase.url;
const SUPABASE_ANON_KEY = CONFIG.supabase.anonKey;

// Valida credenciais
if (SUPABASE_URL.includes('SEU_PROJETO') || SUPABASE_ANON_KEY.includes('SUA_ANON_KEY')) {
    console.warn('⚠️  AVISO: Credenciais do Supabase não configuradas!');
    console.warn('   Edite o arquivo config.js com suas credenciais.');
}

// Inicializa cliente Supabase (usando nome diferente para evitar conflito com window.supabase)
const supabaseDb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// FUNÇÕES DE STORAGE (IMAGENS)
// ============================================

/**
 * Obtém URL pública de uma imagem no Storage
 * @param {string} path - Caminho do arquivo no bucket (ex: units/abc123/main.jpg)
 * @returns {string} URL pública da imagem
 */
function getPublicImageUrl(path) {
    if (!path) return null;
    
    // Se já for uma URL completa, retorna direto
    if (path.startsWith('http')) {
        return path;
    }
    
    const { data } = supabaseDb.storage
        .from(CONFIG.storage.bucket)
        .getPublicUrl(path);
    
    return data?.publicUrl || null;
}

/**
 * Placeholder para imagens não encontradas
 * @param {string} type - Tipo: 'unit' ou 'barber'
 * @returns {string} Data URL do placeholder
 */
function getImagePlaceholder(type = 'unit') {
    const colors = {
        unit: '#1a1a1a',
        barber: '#252525'
    };
    const icons = {
        unit: '🏬',
        barber: '✂'
    };
    
    // Retorna um SVG como data URL
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
            <rect fill="${colors[type] || colors.unit}" width="400" height="300"/>
            <text x="200" y="150" font-size="48" text-anchor="middle" dominant-baseline="middle">
                ${icons[type] || icons.unit}
            </text>
        </svg>
    `;
    
    return `data:image/svg+xml,${encodeURIComponent(svg.trim())}`;
}

// FUTURO STORAGE UPLOAD:
// async function uploadImage(bucket, path, file) {
//     const { data, error } = await supabaseDbDb.storage
//         .from(bucket)
//         .upload(path, file, {
//             cacheControl: '3600',
//             upsert: true
//         });
//     
//     if (error) throw error;
//     return getPublicImageUrl(data.path);
// }

// ============================================
// FUNÇÕES DE UNIDADES
// ============================================

/**
 * Lista todas as unidades com foto
 * @returns {Promise<Array>} Lista de unidades
 */
async function listUnits() {
    const { data, error } = await supabaseDb
        .from('units')
        .select('*')
        .order('name');
    
    if (error) {
        console.error('Erro ao listar unidades:', error);
        throw error;
    }
    
    // Processa URLs das imagens
    return data.map(unit => ({
        ...unit,
        photo_url: unit.photo_url 
            ? getPublicImageUrl(unit.photo_url) 
            : getImagePlaceholder('unit')
    }));
}

/**
 * Obtém uma unidade pelo ID
 * @param {string} unitId - ID da unidade
 * @returns {Promise<Object>} Dados da unidade
 */
async function getUnit(unitId) {
    const { data, error } = await supabaseDb
        .from('units')
        .select('*')
        .eq('id', unitId)
        .single();
    
    if (error) {
        console.error('Erro ao buscar unidade:', error);
        throw error;
    }
    
    return {
        ...data,
        photo_url: data.photo_url 
            ? getPublicImageUrl(data.photo_url) 
            : getImagePlaceholder('unit')
    };
}

// ============================================
// FUNÇÕES DE SERVIÇOS
// ============================================

/**
 * Lista serviços disponíveis em uma unidade
 * @param {string} unitId - ID da unidade
 * @returns {Promise<Array>} Lista de serviços
 */
async function listServicesByUnit(unitId) {
    const { data, error } = await supabaseDb
        .from('unit_services')
        .select(`
            service_id,
            services (
                id,
                name,
                duration_minutes,
                price_cents
            )
        `)
        .eq('unit_id', unitId);
    
    if (error) {
        console.error('Erro ao listar serviços:', error);
        throw error;
    }
    
    // Extrai os serviços do relacionamento
    return data.map(item => ({
        ...item.services,
        // Formata preço para exibição
        price_formatted: formatPrice(item.services.price_cents)
    }));
}

/**
 * Lista todos os serviços (sem filtro de unidade)
 * @returns {Promise<Array>} Lista de serviços
 */
async function listAllServices() {
    const { data, error } = await supabaseDb
        .from('services')
        .select('*')
        .order('name');
    
    if (error) {
        console.error('Erro ao listar serviços:', error);
        throw error;
    }
    
    return data.map(service => ({
        ...service,
        price_formatted: formatPrice(service.price_cents)
    }));
}

// ============================================
// FUNÇÕES DE BARBEIROS
// ============================================

/**
 * Lista barbeiros de uma unidade com avatar
 * @param {string} unitId - ID da unidade
 * @returns {Promise<Array>} Lista de barbeiros
 */
async function listBarbersByUnit(unitId) {
    const { data, error } = await supabaseDb
        .from('barber_units')
        .select(`
            barber_id,
            barbers (
                id,
                bio,
                avatar_url,
                profiles (
                    id,
                    full_name,
                    phone
                )
            )
        `)
        .eq('unit_id', unitId);
    
    if (error) {
        console.error('Erro ao listar barbeiros:', error);
        throw error;
    }
    
    // Extrai e formata os barbeiros
    return data.map(item => ({
        id: item.barbers.id,
        name: item.barbers.profiles?.full_name || 'Barbeiro',
        bio: item.barbers.bio || '',
        avatar_url: item.barbers.avatar_url 
            ? getPublicImageUrl(item.barbers.avatar_url) 
            : getImagePlaceholder('barber'),
        profile_id: item.barbers.profiles?.id
    }));
}

/**
 * Obtém um barbeiro pelo ID
 * @param {string} barberId - ID do barbeiro
 * @returns {Promise<Object>} Dados do barbeiro
 */
async function getBarber(barberId) {
    const { data, error } = await supabaseDb
        .from('barbers')
        .select(`
            id,
            bio,
            avatar_url,
            profiles (
                id,
                full_name,
                phone
            )
        `)
        .eq('id', barberId)
        .single();
    
    if (error) {
        console.error('Erro ao buscar barbeiro:', error);
        throw error;
    }
    
    return {
        id: data.id,
        name: data.profiles?.full_name || 'Barbeiro',
        bio: data.bio || '',
        avatar_url: data.avatar_url 
            ? getPublicImageUrl(data.avatar_url) 
            : getImagePlaceholder('barber'),
        profile_id: data.profiles?.id
    };
}

// ============================================
// FUNÇÕES DE AGENDAMENTOS
// ============================================

/**
 * Cria um novo agendamento
 * @param {Object} payload - Dados do agendamento
 * @returns {Promise<Object>} Agendamento criado
 */
async function createAppointment(payload) {
    const { data, error } = await supabaseDb
        .from('appointments')
        .insert({
            unit_id: payload.unit_id,
            customer_id: payload.customer_id,
            barber_id: payload.barber_id,
            service_id: payload.service_id,
            start_time: payload.start_time,
            status: 'scheduled',
            created_at: new Date().toISOString()
        })
        .select()
        .single();
    
    if (error) {
        console.error('Erro ao criar agendamento:', error);
        throw error;
    }
    
    // FUTURO TRINKS - Após createAppointment():
    // await syncAppointmentToTrinks(payload);
    
    // FUTURO N8N - Após agendamento criado:
    // await triggerN8nWebhook('new_appointment', data);
    
    return data;
}

/**
 * Lista agendamentos de um cliente
 * @param {string} userId - ID do cliente
 * @returns {Promise<Array>} Lista de agendamentos
 */
async function listUserAppointments(userId) {
    const { data, error } = await supabaseDb
        .from('appointments')
        .select(`
            *,
            units (
                id,
                name,
                address,
                photo_url
            ),
            services (
                id,
                name,
                duration_minutes,
                price_cents
            ),
            barbers (
                id,
                bio,
                avatar_url,
                profiles (
                    full_name
                )
            )
        `)
        .eq('customer_id', userId)
        .order('start_time', { ascending: false });
    
    if (error) {
        console.error('Erro ao listar agendamentos:', error);
        throw error;
    }
    
    // Formata os dados
    return data.map(apt => ({
        ...apt,
        unit: {
            ...apt.units,
            photo_url: apt.units?.photo_url 
                ? getPublicImageUrl(apt.units.photo_url) 
                : getImagePlaceholder('unit')
        },
        service: {
            ...apt.services,
            price_formatted: formatPrice(apt.services?.price_cents)
        },
        barber: apt.barbers ? {
            id: apt.barbers.id,
            name: apt.barbers.profiles?.full_name || 'Barbeiro',
            avatar_url: apt.barbers.avatar_url 
                ? getPublicImageUrl(apt.barbers.avatar_url) 
                : getImagePlaceholder('barber')
        } : null
    }));
}

/**
 * Lista agendamentos por unidade e data (para painel admin)
 * @param {string} unitId - ID da unidade
 * @param {string} date - Data no formato YYYY-MM-DD
 * @returns {Promise<Array>} Lista de agendamentos
 */
async function listAppointmentsByUnitAndDate(unitId, date) {
    const startOfDay = `${date}T00:00:00`;
    const endOfDay = `${date}T23:59:59`;
    
    const { data, error } = await supabaseDb
        .from('appointments')
        .select(`
            *,
            services (
                id,
                name,
                duration_minutes
            ),
            barbers (
                id,
                profiles (
                    full_name
                )
            ),
            profiles:customer_id (
                full_name,
                phone
            )
        `)
        .eq('unit_id', unitId)
        .gte('start_time', startOfDay)
        .lte('start_time', endOfDay)
        .order('start_time');
    
    if (error) {
        console.error('Erro ao listar agendamentos:', error);
        throw error;
    }
    
    return data.map(apt => ({
        ...apt,
        service_name: apt.services?.name,
        barber_name: apt.barbers?.profiles?.full_name || 'Não definido',
        customer_name: apt.profiles?.full_name || 'Cliente',
        customer_phone: apt.profiles?.phone
    }));
}

/**
 * Atualiza status de um agendamento
 * @param {string} appointmentId - ID do agendamento
 * @param {string} status - Novo status (scheduled, completed, cancelled)
 * @returns {Promise<Object>} Agendamento atualizado
 */
async function updateAppointmentStatus(appointmentId, status) {
    const { data, error } = await supabaseDb
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId)
        .select()
        .single();
    
    if (error) {
        console.error('Erro ao atualizar agendamento:', error);
        throw error;
    }
    
    // FUTURO N8N - Notificar mudança de status:
    // await triggerN8nWebhook('appointment_status_changed', { appointmentId, status });
    
    return data;
}

/**
 * Obtém horários ocupados de um barbeiro em uma data
 * @param {string} barberId - ID do barbeiro
 * @param {string} date - Data no formato YYYY-MM-DD
 * @returns {Promise<Array>} Lista de horários ocupados
 */
async function getBookedSlots(barberId, date) {
    const startOfDay = `${date}T00:00:00`;
    const endOfDay = `${date}T23:59:59`;
    
    const { data, error } = await supabaseDb
        .from('appointments')
        .select('start_time, services(duration_minutes)')
        .eq('barber_id', barberId)
        .gte('start_time', startOfDay)
        .lte('start_time', endOfDay)
        .neq('status', 'cancelled');
    
    if (error) {
        console.error('Erro ao buscar horários ocupados:', error);
        throw error;
    }
    
    return data.map(apt => ({
        start: new Date(apt.start_time),
        duration: apt.services?.duration_minutes || 30
    }));
}

// ============================================
// FUNÇÕES DE AUTENTICAÇÃO
// ============================================

/**
 * Registra novo usuário com perfil
 * @param {string} email - E-mail do usuário
 * @param {string} password - Senha
 * @param {Object} profileData - Dados do perfil (full_name, phone)
 * @returns {Promise<Object>} Dados do usuário criado
 */
async function signUp(email, password, profileData) {
    // 1. Cria usuário no Auth
    const { data: authData, error: authError } = await supabaseDbDb.auth.signUp({
        email,
        password
    });
    
    if (authError) {
        console.error('Erro no cadastro:', authError);
        throw authError;
    }
    
    // 2. Cria perfil vinculado
    if (authData.user) {
        const { error: profileError } = await supabaseDb
            .from('profiles')
            .insert({
                id: authData.user.id,
                full_name: profileData.full_name,
                phone: profileData.phone,
                role: 'customer' // Padrão: cliente
            });
        
        if (profileError) {
            console.error('Erro ao criar perfil:', profileError);
            // Não lança erro pois o usuário já foi criado
        }
    }
    
    return authData;
}

/**
 * Login com e-mail e senha
 * @param {string} email - E-mail
 * @param {string} password - Senha
 * @returns {Promise<Object>} Dados da sessão
 */
async function signIn(email, password) {
    const { data, error } = await supabaseDbDb.auth.signInWithPassword({
        email,
        password
    });
    
    if (error) {
        console.error('Erro no login:', error);
        throw error;
    }
    
    return data;
}

/**
 * Logout do usuário atual
 */
async function signOut() {
    const { error } = await supabaseDbDb.auth.signOut();
    
    if (error) {
        console.error('Erro no logout:', error);
        throw error;
    }
}

/**
 * Obtém usuário atual
 * @returns {Promise<Object|null>} Usuário atual ou null
 */
async function getCurrentUser() {
    const { data: { user } } = await supabaseDbDb.auth.getUser();
    return user;
}

/**
 * Obtém perfil do usuário atual
 * @returns {Promise<Object|null>} Perfil do usuário
 */
async function getCurrentProfile() {
    const user = await getCurrentUser();
    
    if (!user) return null;
    
    const { data, error } = await supabaseDb
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    
    if (error) {
        console.error('Erro ao buscar perfil:', error);
        return null;
    }
    
    return data;
}

/**
 * Escuta mudanças no estado de autenticação
 * @param {Function} callback - Função a ser chamada quando mudar
 */
function onAuthStateChange(callback) {
    return supabaseDb.auth.onAuthStateChange((event, session) => {
        callback(event, session);
    });
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Formata preço em centavos para reais
 * @param {number} cents - Valor em centavos
 * @returns {string} Valor formatado (ex: R$ 35,00)
 */
function formatPrice(cents) {
    if (!cents) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(cents / 100);
}

/**
 * Formata duração em minutos
 * @param {number} minutes - Duração em minutos
 * @returns {string} Duração formatada (ex: 30min, 1h, 1h30)
 */
function formatDuration(minutes) {
    if (!minutes) return '0min';
    
    if (minutes < 60) {
        return `${minutes}min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (mins === 0) {
        return `${hours}h`;
    }
    
    return `${hours}h${mins}`;
}

/**
 * Formata data para exibição
 * @param {string|Date} date - Data
 * @returns {string} Data formatada (ex: 14/01/2026)
 */
function formatDate(date) {
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(new Date(date));
}

/**
 * Formata hora para exibição
 * @param {string|Date} date - Data/hora
 * @returns {string} Hora formatada (ex: 14:30)
 */
function formatTime(date) {
    return new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(date));
}

/**
 * Formata data completa para exibição
 * @param {string|Date} date - Data
 * @returns {string} Data formatada (ex: Terça, 14 de Janeiro)
 */
function formatDateFull(date) {
    return new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    }).format(new Date(date));
}

// ============================================
// EXPORTS (disponíveis globalmente)
// ============================================

// Disponibiliza funções globalmente para uso no app.js
window.SupabaseClient = {
    // Cliente
    supabase,
    
    // Storage
    getPublicImageUrl,
    getImagePlaceholder,
    
    // Unidades
    listUnits,
    getUnit,
    
    // Serviços
    listServicesByUnit,
    listAllServices,
    
    // Barbeiros
    listBarbersByUnit,
    getBarber,
    
    // Agendamentos
    createAppointment,
    listUserAppointments,
    listAppointmentsByUnitAndDate,
    updateAppointmentStatus,
    getBookedSlots,
    
    // Auth
    signUp,
    signIn,
    signOut,
    getCurrentUser,
    getCurrentProfile,
    onAuthStateChange,
    
    // Helpers
    formatPrice,
    formatDuration,
    formatDate,
    formatTime,
    formatDateFull
};

console.log('✅ Supabase Client inicializado');

