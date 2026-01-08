/**
 * PRIME BARBER - App Principal
 * Lógica de navegação, fluxo de agendamento e interações
 */

// ============================================
// ESTADO GLOBAL
// ============================================

const AppState = {
    // Usuário atual
    currentUser: null,
    currentProfile: null,
    
    // Dados carregados
    units: [],
    services: [],
    barbers: [],
    
    // Estado do agendamento
    booking: {
        step: 1,
        unit: null,
        service: null,
        barber: null,
        date: null,
        time: null
    },
    
    // Admin
    adminDate: new Date(),
    adminUnit: null
};

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Prime Barber App iniciando...');
    
    // Setup navegação mobile
    setupMobileNav();
    
    // Escuta mudanças de autenticação
    setupAuthListener();
    
    // Carrega dados iniciais
    await loadInitialData();
    
    // Verifica se há seção na URL
    const hash = window.location.hash.slice(1);
    if (hash && document.getElementById(`section-${hash}`)) {
        showSection(hash);
    }
    
    console.log('✅ App inicializado');
});

/**
 * Configura navegação mobile
 */
function setupMobileNav() {
    const menuToggle = document.getElementById('menuToggle');
    const nav = document.getElementById('nav');
    
    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        nav.classList.toggle('active');
    });
    
    // Fecha menu ao clicar em link
    nav.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            menuToggle.classList.remove('active');
            nav.classList.remove('active');
        });
    });
}

/**
 * Setup listener de autenticação
 */
function setupAuthListener() {
    SupabaseClient.onAuthStateChange(async (event, session) => {
        console.log('Auth event:', event);
        
        if (session?.user) {
            AppState.currentUser = session.user;
            AppState.currentProfile = await SupabaseClient.getCurrentProfile();
            updateUIForAuth(true);
        } else {
            AppState.currentUser = null;
            AppState.currentProfile = null;
            updateUIForAuth(false);
        }
    });
}

/**
 * Carrega dados iniciais
 */
async function loadInitialData() {
    try {
        showLoading(true);
        
        // Carrega unidades
        AppState.units = await SupabaseClient.listUnits();
        
        // Renderiza na home
        renderHomeUnits();
        renderUnitsPage();
        renderBookingUnits();
        
        // Carrega todos os serviços para preview na home
        const allServices = await SupabaseClient.listAllServices();
        renderHomeServices(allServices);
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showToast('Erro ao carregar dados. Verifique sua conexão.', 'error');
    } finally {
        showLoading(false);
    }
}

// ============================================
// NAVEGAÇÃO
// ============================================

/**
 * Mostra uma seção específica
 * @param {string} sectionId - ID da seção (home, units, booking, auth, dashboard, admin)
 */
function showSection(sectionId) {
    // Esconde todas as seções
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Mostra a seção solicitada
    const targetSection = document.getElementById(`section-${sectionId}`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Atualiza navegação
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Ações específicas por seção
    switch (sectionId) {
        case 'booking':
            // Reset booking se necessário
            if (AppState.booking.step === 1) {
                resetBooking();
            }
            break;
        case 'dashboard':
            if (!AppState.currentUser) {
                showSection('auth');
                showToast('Faça login para acessar sua área', 'warning');
                return;
            }
            loadDashboard();
            break;
        case 'admin':
            if (!AppState.currentProfile || !['admin', 'barber'].includes(AppState.currentProfile.role)) {
                showSection('home');
                showToast('Acesso não autorizado', 'error');
                return;
            }
            loadAdminPanel();
            break;
    }
    
    // Scroll para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Atualiza URL
    history.pushState(null, '', `#${sectionId}`);
}

/**
 * Atualiza UI baseado no estado de autenticação
 * @param {boolean} isLoggedIn - Se está logado
 */
function updateUIForAuth(isLoggedIn) {
    const navAuth = document.getElementById('nav-auth');
    const navDashboard = document.getElementById('nav-dashboard');
    const navLogout = document.getElementById('nav-logout');
    const userName = document.getElementById('user-name');
    
    if (isLoggedIn) {
        navAuth.classList.add('hidden');
        navDashboard.classList.remove('hidden');
        navLogout.classList.remove('hidden');
        
        if (userName && AppState.currentProfile) {
            userName.textContent = AppState.currentProfile.full_name || 'Cliente';
        }
        
        // Se for admin/barbeiro, adiciona link para painel
        if (AppState.currentProfile && ['admin', 'barber'].includes(AppState.currentProfile.role)) {
            // Poderia adicionar link para admin aqui
        }
    } else {
        navAuth.classList.remove('hidden');
        navDashboard.classList.add('hidden');
        navLogout.classList.add('hidden');
    }
}

// ============================================
// RENDERIZAÇÃO - HOME
// ============================================

/**
 * Renderiza unidades na home
 */
function renderHomeUnits() {
    const container = document.getElementById('home-units-grid');
    if (!container) return;
    
    if (AppState.units.length === 0) {
        container.innerHTML = '<p class="empty-state">Nenhuma unidade cadastrada</p>';
        return;
    }
    
    container.innerHTML = AppState.units.slice(0, 4).map(unit => `
        <div class="unit-card" onclick="selectUnitAndBook('${unit.id}')">
            <img 
                src="${unit.photo_url}" 
                alt="${unit.name}" 
                class="unit-card-image"
                loading="lazy"
                onerror="this.src='${SupabaseClient.getImagePlaceholder('unit')}'"
            >
            <div class="unit-card-content">
                <h3 class="unit-card-name">${unit.name}</h3>
                <p class="unit-card-address">${unit.address || ''} ${unit.city ? '- ' + unit.city : ''}</p>
            </div>
        </div>
    `).join('');
}

/**
 * Renderiza serviços na home
 * @param {Array} services - Lista de serviços
 */
function renderHomeServices(services) {
    const container = document.getElementById('home-services-preview');
    if (!container) return;
    
    if (services.length === 0) {
        container.innerHTML = '<p class="empty-state">Nenhum serviço cadastrado</p>';
        return;
    }
    
    container.innerHTML = services.slice(0, 6).map(service => `
        <div class="service-card">
            <div class="service-card-info">
                <span class="service-card-name">${service.name}</span>
                <span class="service-card-duration">${SupabaseClient.formatDuration(service.duration_minutes)}</span>
            </div>
            <span class="service-card-price">${service.price_formatted}</span>
        </div>
    `).join('');
}

// ============================================
// RENDERIZAÇÃO - PÁGINA UNIDADES
// ============================================

/**
 * Renderiza página de unidades
 */
function renderUnitsPage() {
    const container = document.getElementById('units-list');
    if (!container) return;
    
    if (AppState.units.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">🏬</span>
                <p>Nenhuma unidade cadastrada</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = AppState.units.map(unit => `
        <div class="unit-card" onclick="selectUnitAndBook('${unit.id}')" style="display: flex; flex-direction: row;">
            <img 
                src="${unit.photo_url}" 
                alt="${unit.name}" 
                class="unit-card-image"
                style="width: 120px; height: 100%; min-height: 120px;"
                loading="lazy"
                onerror="this.src='${SupabaseClient.getImagePlaceholder('unit')}'"
            >
            <div class="unit-card-content" style="flex: 1;">
                <h3 class="unit-card-name">${unit.name}</h3>
                <p class="unit-card-address">${unit.address || ''}</p>
                ${unit.city ? `<p class="unit-card-address">${unit.city}</p>` : ''}
                <button class="btn btn-primary" style="margin-top: 12px;">Agendar Nesta Unidade</button>
            </div>
        </div>
    `).join('');
}

/**
 * Seleciona unidade e inicia booking
 * @param {string} unitId - ID da unidade
 */
function selectUnitAndBook(unitId) {
    const unit = AppState.units.find(u => u.id === unitId);
    if (unit) {
        AppState.booking.unit = unit;
        showSection('booking');
        renderBookingUnits();
        // Marca como selecionada e avança
        document.querySelectorAll('.booking-units-grid .unit-card').forEach(card => {
            if (card.dataset.unitId === unitId) {
                card.classList.add('selected');
            }
        });
        nextStep();
    }
}

// ============================================
// FLUXO DE AGENDAMENTO
// ============================================

/**
 * Renderiza unidades no booking
 */
function renderBookingUnits() {
    const container = document.getElementById('booking-units-grid');
    if (!container) return;
    
    container.innerHTML = AppState.units.map(unit => `
        <div class="unit-card ${AppState.booking.unit?.id === unit.id ? 'selected' : ''}" 
             data-unit-id="${unit.id}"
             onclick="selectUnit('${unit.id}')">
            <img 
                src="${unit.photo_url}" 
                alt="${unit.name}" 
                class="unit-card-image"
                loading="lazy"
                onerror="this.src='${SupabaseClient.getImagePlaceholder('unit')}'"
            >
            <div class="unit-card-content">
                <h3 class="unit-card-name">${unit.name}</h3>
                <p class="unit-card-address">${unit.address || ''}</p>
            </div>
        </div>
    `).join('');
}

/**
 * Seleciona uma unidade
 * @param {string} unitId - ID da unidade
 */
function selectUnit(unitId) {
    const unit = AppState.units.find(u => u.id === unitId);
    if (!unit) return;
    
    AppState.booking.unit = unit;
    
    // Atualiza UI
    document.querySelectorAll('.booking-units-grid .unit-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.unitId === unitId);
    });
    
    // Avança para próxima etapa
    setTimeout(() => nextStep(), 300);
}

/**
 * Renderiza serviços no booking
 */
async function renderBookingServices() {
    const container = document.getElementById('booking-services-list');
    if (!container || !AppState.booking.unit) return;
    
    container.innerHTML = '<div class="skeleton-service"></div><div class="skeleton-service"></div>';
    
    try {
        AppState.services = await SupabaseClient.listServicesByUnit(AppState.booking.unit.id);
        
        if (AppState.services.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Nenhum serviço disponível nesta unidade</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = AppState.services.map(service => `
            <div class="service-card ${AppState.booking.service?.id === service.id ? 'selected' : ''}"
                 data-service-id="${service.id}"
                 onclick="selectService('${service.id}')">
                <div class="service-card-info">
                    <span class="service-card-name">${service.name}</span>
                    <span class="service-card-duration">${SupabaseClient.formatDuration(service.duration_minutes)}</span>
                </div>
                <span class="service-card-price">${service.price_formatted}</span>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erro ao carregar serviços:', error);
        container.innerHTML = '<p class="empty-state">Erro ao carregar serviços</p>';
    }
}

/**
 * Seleciona um serviço
 * @param {string} serviceId - ID do serviço
 */
function selectService(serviceId) {
    const service = AppState.services.find(s => s.id === serviceId);
    if (!service) return;
    
    AppState.booking.service = service;
    
    // Atualiza UI
    document.querySelectorAll('.services-list .service-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.serviceId === serviceId);
    });
    
    // Avança para próxima etapa
    setTimeout(() => nextStep(), 300);
}

/**
 * Renderiza barbeiros no booking
 */
async function renderBookingBarbers() {
    const container = document.getElementById('booking-barbers-grid');
    if (!container || !AppState.booking.unit) return;
    
    container.innerHTML = '<div class="skeleton-barber"></div><div class="skeleton-barber"></div>';
    
    try {
        AppState.barbers = await SupabaseClient.listBarbersByUnit(AppState.booking.unit.id);
        
        if (AppState.barbers.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Nenhum barbeiro disponível nesta unidade</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = AppState.barbers.map(barber => `
            <div class="barber-card ${AppState.booking.barber?.id === barber.id ? 'selected' : ''}"
                 data-barber-id="${barber.id}"
                 onclick="selectBarber('${barber.id}')">
                <img 
                    src="${barber.avatar_url}" 
                    alt="${barber.name}" 
                    class="barber-card-avatar"
                    loading="lazy"
                    onerror="this.src='${SupabaseClient.getImagePlaceholder('barber')}'"
                >
                <span class="barber-card-name">${barber.name}</span>
                <span class="barber-card-bio">${barber.bio || 'Profissional experiente'}</span>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erro ao carregar barbeiros:', error);
        container.innerHTML = '<p class="empty-state">Erro ao carregar barbeiros</p>';
    }
}

/**
 * Seleciona um barbeiro
 * @param {string} barberId - ID do barbeiro
 */
function selectBarber(barberId) {
    const barber = AppState.barbers.find(b => b.id === barberId);
    if (!barber) return;
    
    AppState.booking.barber = barber;
    
    // Atualiza UI
    document.querySelectorAll('.barbers-grid .barber-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.barberId === barberId);
    });
    
    // Avança para próxima etapa
    setTimeout(() => nextStep(), 300);
}

/**
 * Renderiza seletor de datas
 */
function renderDatePicker() {
    const container = document.getElementById('date-scroll');
    if (!container) return;
    
    const today = new Date();
    const dates = [];
    
    // Gera próximos 14 dias
    for (let i = 0; i < 14; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        dates.push(date);
    }
    
    const dayNames = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
    const monthNames = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    
    container.innerHTML = dates.map(date => {
        const dateStr = date.toISOString().split('T')[0];
        const isSelected = AppState.booking.date === dateStr;
        // Verifica se é dia de fechamento (configurado em config.js)
        const closedDays = CONFIG?.app?.closedDays || [0];
        const isClosed = closedDays.includes(date.getDay());
        
        return `
            <div class="date-item ${isSelected ? 'selected' : ''} ${isClosed ? 'disabled' : ''}"
                 data-date="${dateStr}"
                 onclick="${isClosed ? '' : `selectDate('${dateStr}')`}">
                <span class="date-item-day">${dayNames[date.getDay()]}</span>
                <span class="date-item-number">${date.getDate()}</span>
                <span class="date-item-month">${monthNames[date.getMonth()]}</span>
            </div>
        `;
    }).join('');
    
    // Setup navegação
    document.getElementById('date-prev').onclick = () => scrollDates(-1);
    document.getElementById('date-next').onclick = () => scrollDates(1);
}

/**
 * Scroll nas datas
 * @param {number} direction - -1 para esquerda, 1 para direita
 */
function scrollDates(direction) {
    const container = document.getElementById('date-scroll');
    container.scrollBy({ left: direction * 200, behavior: 'smooth' });
}

/**
 * Seleciona uma data
 * @param {string} dateStr - Data no formato YYYY-MM-DD
 */
async function selectDate(dateStr) {
    AppState.booking.date = dateStr;
    AppState.booking.time = null;
    
    // Atualiza UI
    document.querySelectorAll('.date-item').forEach(item => {
        item.classList.toggle('selected', item.dataset.date === dateStr);
    });
    
    // Carrega horários
    await renderTimeSlots();
}

/**
 * Renderiza horários disponíveis
 */
async function renderTimeSlots() {
    const container = document.getElementById('time-slots');
    if (!container || !AppState.booking.date || !AppState.booking.barber) return;
    
    container.innerHTML = '<p class="time-slots-empty">Carregando horários...</p>';
    
    try {
        // Busca horários ocupados
        const bookedSlots = await SupabaseClient.getBookedSlots(
            AppState.booking.barber.id,
            AppState.booking.date
        );
        
        // Gera todos os horários possíveis (configurado em config.js)
        const businessHours = CONFIG?.app?.businessHours || { start: 9, end: 19 };
        const slotInterval = CONFIG?.app?.slotInterval || 30;
        const slots = [];
        
        for (let hour = businessHours.start; hour < businessHours.end; hour++) {
            for (let min = 0; min < 60; min += slotInterval) {
                slots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
            }
        }
        
        // Verifica disponibilidade
        const selectedDate = new Date(AppState.booking.date);
        const now = new Date();
        const isToday = selectedDate.toDateString() === now.toDateString();
        
        container.innerHTML = slots.map(slot => {
            const [hours, minutes] = slot.split(':').map(Number);
            const slotTime = new Date(AppState.booking.date);
            slotTime.setHours(hours, minutes, 0, 0);
            
            // Verifica se já passou (para hoje)
            const isPast = isToday && slotTime <= now;
            
            // Verifica se está ocupado
            const isBooked = bookedSlots.some(booked => {
                const bookedEnd = new Date(booked.start);
                bookedEnd.setMinutes(bookedEnd.getMinutes() + booked.duration);
                return slotTime >= booked.start && slotTime < bookedEnd;
            });
            
            const isDisabled = isPast || isBooked;
            const isSelected = AppState.booking.time === slot;
            
            return `
                <div class="time-slot ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}"
                     data-time="${slot}"
                     onclick="${isDisabled ? '' : `selectTime('${slot}')`}">
                    ${slot}
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Erro ao carregar horários:', error);
        container.innerHTML = '<p class="time-slots-empty">Erro ao carregar horários</p>';
    }
}

/**
 * Seleciona um horário
 * @param {string} time - Horário (ex: 14:00)
 */
function selectTime(time) {
    AppState.booking.time = time;
    
    // Atualiza UI
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.classList.toggle('selected', slot.dataset.time === time);
    });
    
    // Avança para próxima etapa
    setTimeout(() => nextStep(), 300);
}

/**
 * Atualiza imagens fixas nas etapas
 */
function updateStepHeaders() {
    const unit = AppState.booking.unit;
    const barber = AppState.booking.barber;
    
    // Step 2
    if (unit) {
        document.getElementById('step2-unit-img').src = unit.photo_url;
        document.getElementById('step2-unit-name').textContent = unit.name;
        document.getElementById('step3-unit-img').src = unit.photo_url;
        document.getElementById('step3-unit-name').textContent = unit.name;
        document.getElementById('step4-unit-img').src = unit.photo_url;
    }
    
    // Step 4
    if (barber) {
        document.getElementById('step4-barber-img').src = barber.avatar_url;
        document.getElementById('step4-barber-name').textContent = barber.name;
    }
}

/**
 * Renderiza resumo da confirmação
 */
function renderConfirmation() {
    const { unit, service, barber, date, time } = AppState.booking;
    
    // Imagens
    document.getElementById('confirm-unit-img').src = unit.photo_url;
    document.getElementById('confirm-barber-img').src = barber.avatar_url;
    
    // Textos
    document.getElementById('confirm-unit-name').textContent = unit.name;
    document.getElementById('confirm-unit-address').textContent = unit.address || '';
    document.getElementById('confirm-barber-name').textContent = barber.name;
    document.getElementById('confirm-service-name').textContent = service.name;
    document.getElementById('confirm-date').textContent = SupabaseClient.formatDateFull(date);
    document.getElementById('confirm-time').textContent = time;
    document.getElementById('confirm-duration').textContent = SupabaseClient.formatDuration(service.duration_minutes);
    document.getElementById('confirm-price').textContent = service.price_formatted;
}

/**
 * Avança para próxima etapa
 */
async function nextStep() {
    const currentStep = AppState.booking.step;
    
    // Validações por etapa
    switch (currentStep) {
        case 1:
            if (!AppState.booking.unit) {
                showToast('Selecione uma unidade', 'warning');
                return;
            }
            await renderBookingServices();
            break;
        case 2:
            if (!AppState.booking.service) {
                showToast('Selecione um serviço', 'warning');
                return;
            }
            await renderBookingBarbers();
            break;
        case 3:
            if (!AppState.booking.barber) {
                showToast('Selecione um barbeiro', 'warning');
                return;
            }
            renderDatePicker();
            break;
        case 4:
            if (!AppState.booking.date || !AppState.booking.time) {
                showToast('Selecione data e horário', 'warning');
                return;
            }
            renderConfirmation();
            break;
    }
    
    // Avança
    if (currentStep < 5) {
        AppState.booking.step = currentStep + 1;
        updateBookingUI();
    }
}

/**
 * Volta para etapa anterior
 */
function prevStep() {
    if (AppState.booking.step > 1) {
        AppState.booking.step--;
        updateBookingUI();
    }
}

/**
 * Atualiza UI do booking
 */
function updateBookingUI() {
    const step = AppState.booking.step;
    
    // Atualiza barra de progresso
    const progressFill = document.getElementById('progress-fill');
    progressFill.style.width = `${step * 20}%`;
    
    // Atualiza indicadores
    document.querySelectorAll('.progress-step').forEach(el => {
        const stepNum = parseInt(el.dataset.step);
        el.classList.remove('active', 'completed');
        
        if (stepNum === step) {
            el.classList.add('active');
        } else if (stepNum < step) {
            el.classList.add('completed');
        }
    });
    
    // Mostra container correto
    document.querySelectorAll('.step-container').forEach(container => {
        container.classList.remove('active');
    });
    
    const targetContainer = document.getElementById(`step-${step}`);
    if (targetContainer) {
        targetContainer.classList.add('active');
    }
    
    // Atualiza headers com imagens
    updateStepHeaders();
}

/**
 * Confirma o agendamento
 */
async function confirmBooking() {
    // Verifica login
    if (!AppState.currentUser) {
        showToast('Faça login para confirmar o agendamento', 'warning');
        // Salva estado e redireciona para login
        sessionStorage.setItem('pendingBooking', JSON.stringify(AppState.booking));
        showSection('auth');
        return;
    }
    
    const { unit, service, barber, date, time } = AppState.booking;
    const btnConfirm = document.getElementById('btn-confirm');
    
    try {
        btnConfirm.disabled = true;
        btnConfirm.textContent = 'Confirmando...';
        
        // Monta datetime
        const startTime = new Date(`${date}T${time}:00`);
        
        // Cria agendamento
        const appointment = await SupabaseClient.createAppointment({
            unit_id: unit.id,
            customer_id: AppState.currentUser.id,
            barber_id: barber.id,
            service_id: service.id,
            start_time: startTime.toISOString()
        });
        
        // Mostra sucesso
        showSuccessState(appointment);
        showToast('Agendamento confirmado com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao confirmar:', error);
        showToast('Erro ao confirmar agendamento. Tente novamente.', 'error');
    } finally {
        btnConfirm.disabled = false;
        btnConfirm.textContent = '✓ Confirmar Agendamento';
    }
}

/**
 * Mostra estado de sucesso
 * @param {Object} appointment - Dados do agendamento criado
 */
function showSuccessState(appointment) {
    const { unit, service, barber, date, time } = AppState.booking;
    
    // Esconde step 5, mostra success
    document.getElementById('step-5').classList.remove('active');
    document.getElementById('step-success').classList.add('active');
    
    // Preenche detalhes
    const details = document.getElementById('success-details');
    details.innerHTML = `
        <div class="confirmation-row">
            <span class="confirmation-label">Unidade</span>
            <span class="confirmation-value">${unit.name}</span>
        </div>
        <div class="confirmation-row">
            <span class="confirmation-label">Barbeiro</span>
            <span class="confirmation-value">${barber.name}</span>
        </div>
        <div class="confirmation-row">
            <span class="confirmation-label">Serviço</span>
            <span class="confirmation-value">${service.name}</span>
        </div>
        <div class="confirmation-row">
            <span class="confirmation-label">Data</span>
            <span class="confirmation-value">${SupabaseClient.formatDateFull(date)}</span>
        </div>
        <div class="confirmation-row">
            <span class="confirmation-label">Horário</span>
            <span class="confirmation-value">${time}</span>
        </div>
    `;
    
    // Atualiza barra de progresso para 100%
    document.getElementById('progress-fill').style.width = '100%';
    document.querySelectorAll('.progress-step').forEach(el => {
        el.classList.add('completed');
        el.classList.remove('active');
    });
}

/**
 * Reseta o booking
 */
function resetBooking() {
    AppState.booking = {
        step: 1,
        unit: null,
        service: null,
        barber: null,
        date: null,
        time: null
    };
    
    // Esconde sucesso se visível
    document.getElementById('step-success').classList.remove('active');
    
    // Reseta UI
    updateBookingUI();
    renderBookingUnits();
    
    // Limpa seleções
    document.querySelectorAll('.unit-card.selected, .service-card.selected, .barber-card.selected').forEach(el => {
        el.classList.remove('selected');
    });
}

// ============================================
// AUTENTICAÇÃO
// ============================================

/**
 * Toggle entre login e cadastro
 * @param {string} form - 'login' ou 'register'
 */
function toggleAuthForm(form) {
    document.getElementById('auth-login').classList.toggle('active', form === 'login');
    document.getElementById('auth-register').classList.toggle('active', form === 'register');
}

/**
 * Handler do login
 * @param {Event} event - Evento do form
 */
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    const btnLogin = document.getElementById('btn-login');
    
    try {
        btnLogin.disabled = true;
        btnLogin.textContent = 'Entrando...';
        errorEl.classList.add('hidden');
        
        await SupabaseClient.signIn(email, password);
        
        showToast('Login realizado com sucesso!', 'success');
        
        // Verifica se há booking pendente
        const pendingBooking = sessionStorage.getItem('pendingBooking');
        if (pendingBooking) {
            AppState.booking = JSON.parse(pendingBooking);
            sessionStorage.removeItem('pendingBooking');
            showSection('booking');
            // Vai para confirmação
            AppState.booking.step = 5;
            updateBookingUI();
            renderConfirmation();
        } else {
            showSection('dashboard');
        }
        
        // Limpa form
        event.target.reset();
        
    } catch (error) {
        console.error('Erro no login:', error);
        errorEl.textContent = error.message || 'Erro ao fazer login. Verifique suas credenciais.';
        errorEl.classList.remove('hidden');
    } finally {
        btnLogin.disabled = false;
        btnLogin.textContent = 'Entrar';
    }
}

/**
 * Handler do cadastro
 * @param {Event} event - Evento do form
 */
async function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const phone = document.getElementById('register-phone').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const errorEl = document.getElementById('register-error');
    const btnRegister = document.getElementById('btn-register');
    
    try {
        btnRegister.disabled = true;
        btnRegister.textContent = 'Criando conta...';
        errorEl.classList.add('hidden');
        
        await SupabaseClient.signUp(email, password, {
            full_name: name,
            phone: phone
        });
        
        showToast('Conta criada com sucesso! Verifique seu e-mail.', 'success');
        
        // Vai para login
        toggleAuthForm('login');
        event.target.reset();
        
    } catch (error) {
        console.error('Erro no cadastro:', error);
        errorEl.textContent = error.message || 'Erro ao criar conta. Tente novamente.';
        errorEl.classList.remove('hidden');
    } finally {
        btnRegister.disabled = false;
        btnRegister.textContent = 'Criar Conta';
    }
}

/**
 * Handler do logout
 */
async function handleLogout() {
    try {
        await SupabaseClient.signOut();
        showToast('Logout realizado com sucesso!', 'success');
        showSection('home');
    } catch (error) {
        console.error('Erro no logout:', error);
        showToast('Erro ao fazer logout', 'error');
    }
}

// ============================================
// DASHBOARD
// ============================================

/**
 * Carrega dashboard do cliente
 */
async function loadDashboard() {
    if (!AppState.currentUser) return;
    
    const upcomingContainer = document.getElementById('upcoming-appointments');
    const pastContainer = document.getElementById('past-appointments');
    
    try {
        const appointments = await SupabaseClient.listUserAppointments(AppState.currentUser.id);
        
        const now = new Date();
        const upcoming = appointments.filter(apt => new Date(apt.start_time) >= now && apt.status !== 'cancelled');
        const past = appointments.filter(apt => new Date(apt.start_time) < now || apt.status === 'cancelled');
        
        // Renderiza próximos
        if (upcoming.length === 0) {
            upcomingContainer.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">📅</span>
                    <p>Nenhum agendamento futuro</p>
                    <button class="btn btn-secondary" onclick="showSection('booking')">Agendar Agora</button>
                </div>
            `;
        } else {
            upcomingContainer.innerHTML = upcoming.map(apt => renderAppointmentCard(apt)).join('');
        }
        
        // Renderiza histórico
        if (past.length === 0) {
            pastContainer.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">📋</span>
                    <p>Nenhum agendamento anterior</p>
                </div>
            `;
        } else {
            pastContainer.innerHTML = past.slice(0, 10).map(apt => renderAppointmentCard(apt)).join('');
        }
        
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        showToast('Erro ao carregar agendamentos', 'error');
    }
}

/**
 * Renderiza card de agendamento
 * @param {Object} apt - Dados do agendamento
 * @returns {string} HTML do card
 */
function renderAppointmentCard(apt) {
    const statusMap = {
        scheduled: { text: 'Agendado', class: 'status-scheduled', icon: '⏳' },
        completed: { text: 'Concluído', class: 'status-completed', icon: '✅' },
        cancelled: { text: 'Cancelado', class: 'status-cancelled', icon: '❌' }
    };
    
    const status = statusMap[apt.status] || statusMap.scheduled;
    
    return `
        <div class="appointment-card">
            <img 
                src="${apt.unit?.photo_url || SupabaseClient.getImagePlaceholder('unit')}" 
                alt="${apt.unit?.name}" 
                class="appointment-card-image"
                loading="lazy"
            >
            <div class="appointment-card-content">
                <div class="appointment-card-header">
                    <span class="appointment-card-title">${apt.unit?.name || 'Unidade'}</span>
                    <span class="appointment-card-status ${status.class}">${status.icon} ${status.text}</span>
                </div>
                <p class="appointment-card-details">
                    ${SupabaseClient.formatDate(apt.start_time)} às ${SupabaseClient.formatTime(apt.start_time)} — ${apt.service?.name || 'Serviço'}
                </p>
                ${apt.barber ? `
                    <div class="appointment-card-barber">
                        <img 
                            src="${apt.barber.avatar_url}" 
                            alt="${apt.barber.name}" 
                            class="appointment-card-barber-avatar"
                            loading="lazy"
                        >
                        <span class="appointment-card-barber-name">${apt.barber.name}</span>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// ============================================
// ADMIN PANEL
// ============================================

/**
 * Carrega painel administrativo
 */
async function loadAdminPanel() {
    // Popula select de unidades
    const unitSelect = document.getElementById('admin-unit-select');
    unitSelect.innerHTML = AppState.units.map(unit => `
        <option value="${unit.id}" ${AppState.adminUnit?.id === unit.id ? 'selected' : ''}>
            ${unit.name}
        </option>
    `).join('');
    
    // Define unidade inicial
    if (!AppState.adminUnit && AppState.units.length > 0) {
        AppState.adminUnit = AppState.units[0];
    }
    
    // Setup navegação de data
    document.getElementById('admin-prev-day').onclick = () => changeAdminDate(-1);
    document.getElementById('admin-next-day').onclick = () => changeAdminDate(1);
    
    // Carrega agendamentos
    await loadAdminAppointments();
}

/**
 * Muda data do admin
 * @param {number} days - Número de dias para avançar/voltar
 */
function changeAdminDate(days) {
    AppState.adminDate.setDate(AppState.adminDate.getDate() + days);
    loadAdminAppointments();
}

/**
 * Carrega agendamentos do admin
 */
async function loadAdminAppointments() {
    const unitSelect = document.getElementById('admin-unit-select');
    const unitId = unitSelect.value;
    const dateStr = AppState.adminDate.toISOString().split('T')[0];
    
    // Atualiza display de data
    document.getElementById('admin-current-date').textContent = SupabaseClient.formatDateFull(AppState.adminDate);
    
    const container = document.getElementById('admin-appointments');
    container.innerHTML = '<div class="skeleton-service"></div>';
    
    try {
        const appointments = await SupabaseClient.listAppointmentsByUnitAndDate(unitId, dateStr);
        
        if (appointments.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">📋</span>
                    <p>Nenhum agendamento para esta data</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = appointments.map(apt => `
            <div class="admin-appointment-card">
                <span class="admin-appointment-time">${SupabaseClient.formatTime(apt.start_time)}</span>
                <div class="admin-appointment-info">
                    <p class="admin-appointment-client">${apt.customer_name}</p>
                    <p class="admin-appointment-service">${apt.service_name} — ${apt.barber_name}</p>
                </div>
                <span class="admin-appointment-status ${apt.status === 'completed' ? 'status-completed' : 'status-scheduled'}"
                      onclick="toggleAppointmentStatus('${apt.id}', '${apt.status}')">
                    ${apt.status === 'completed' ? '✅ Concluído' : '⏳ Agendado'}
                </span>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Erro ao carregar agendamentos admin:', error);
        container.innerHTML = '<p class="empty-state">Erro ao carregar agendamentos</p>';
    }
}

/**
 * Toggle status de agendamento (admin)
 * @param {string} appointmentId - ID do agendamento
 * @param {string} currentStatus - Status atual
 */
async function toggleAppointmentStatus(appointmentId, currentStatus) {
    const newStatus = currentStatus === 'completed' ? 'scheduled' : 'completed';
    
    try {
        await SupabaseClient.updateAppointmentStatus(appointmentId, newStatus);
        showToast('Status atualizado!', 'success');
        loadAdminAppointments();
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        showToast('Erro ao atualizar status', 'error');
    }
}

// ============================================
// UTILITÁRIOS UI
// ============================================

/**
 * Mostra/esconde loading overlay
 * @param {boolean} show - Se deve mostrar
 */
function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.toggle('hidden', !show);
}

/**
 * Mostra toast notification
 * @param {string} message - Mensagem
 * @param {string} type - Tipo: success, error, warning, info
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    container.appendChild(toast);
    
    // Remove automaticamente após 5s
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// ============================================
// EXPORTS GLOBAIS
// ============================================

// Disponibiliza funções para uso inline no HTML
window.showSection = showSection;
window.selectUnit = selectUnit;
window.selectUnitAndBook = selectUnitAndBook;
window.selectService = selectService;
window.selectBarber = selectBarber;
window.selectDate = selectDate;
window.selectTime = selectTime;
window.nextStep = nextStep;
window.prevStep = prevStep;
window.confirmBooking = confirmBooking;
window.resetBooking = resetBooking;
window.toggleAuthForm = toggleAuthForm;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleLogout = handleLogout;
window.loadAdminAppointments = loadAdminAppointments;
window.toggleAppointmentStatus = toggleAppointmentStatus;
window.showToast = showToast;

