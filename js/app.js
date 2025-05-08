
// 維修客服系統主邏輯
document.addEventListener('DOMContentLoaded', function() {
    // 數據庫
    const db = {
        tickets: JSON.parse(localStorage.getItem('repair-tickets')) || [],
        technicians: [
            { id: 1, name: '技術人員A' },
            { id: 2, name: '技術人員B' },
            { id: 3, name: '技術人員C' }
        ],
        currentUser: null
    };

    // 保存數據到本地存儲
    function saveToLocalStorage() {
        localStorage.setItem('repair-tickets', JSON.stringify(db.tickets));
    }

    // DOM元素
    const ticketList = document.getElementById('ticket-list');
    const technicianList = document.getElementById('technician-list');
    const createTicketBtn = document.getElementById('create-ticket');

    // 初始化
    function init() {
        // 設置登入事件監聽
        document.getElementById('login-cs').addEventListener('click', () => login('cs'));
        document.getElementById('login-tech').addEventListener('click', () => {
            const techSelect = document.getElementById('tech-select');
            if (!techSelect.value) {
                alert('請選擇技術人員');
                return;
            }
            login('tech', techSelect.value);
        });
        document.getElementById('logout-btn').addEventListener('click', logout);
        
        // 根據用戶身份初始化界面
        if (!db.currentUser) {
            document.getElementById('login-modal').style.display = 'flex';
            document.getElementById('main-system').style.display = 'none';
        } else {
            document.getElementById('login-modal').style.display = 'none';
            document.getElementById('main-system').style.display = 'block';
            renderTicketList();
            renderTechnicianList();
            setupEventListeners();
        }
    }

    // 登入功能
    function login(userType, techName = null) {
        db.currentUser = {
            type: userType,
            techName: techName
        };
        document.getElementById('login-modal').style.display = 'none';
        document.getElementById('main-system').style.display = 'block';
        
        // 根據用戶類型調整界面
        if (userType === 'cs') {
            // 客服人員界面 - 顯示所有功能
            document.getElementById('technician-section').style.display = 'block';
            document.getElementById('create-ticket').style.display = 'block';
            document.querySelector('header h1').textContent = '維修客服系統';
        } else {
            // 技術人員界面 - 只能查看和處理維修單
            document.getElementById('technician-section').style.display = 'none';
            document.getElementById('create-ticket').style.display = 'none';
            // 顯示當前登入技術人員
            document.querySelector('header h1').textContent = `維修客服系統 - ${techName}`;
        }
        
        renderTicketList();
        renderTechnicianList();
        setupEventListeners();
    }

    // 登出功能
    function logout() {
        db.currentUser = null;
        document.getElementById('login-modal').style.display = 'flex';
        document.getElementById('main-system').style.display = 'none';
    }


    // 渲染維修單列表
    function renderTicketList(tickets = db.tickets) {
        // 如果是技术人员，只显示指派给自己的维修单
        const filteredTickets = db.currentUser?.type === 'tech' 
            ? tickets.filter(t => t.technician === db.currentUser.techName)
            : tickets;
            
        ticketList.innerHTML = filteredTickets.map(ticket => `
            <div class="ticket-item" data-id="${ticket.id}">
                <h3>${ticket.name}</h3>
                <p>客戶: ${ticket.customer}</p>
                <p>問題: ${ticket.issue}</p>
                <p>狀態: ${ticket.status}</p>
                <p>建立時間: ${ticket.createdAt}</p>
                <p>最後更新: ${ticket.updatedAt}</p>
                <p>指派技師: ${ticket.technician || '未指派'}</p>
                ${db.currentUser?.type === 'cs' ? `
                <button class="edit-btn">編輯</button>
                <button class="delete-btn">刪除</button>
                <button class="assign-btn">指派技師</button>
            ` : ticket.technician === db.currentUser?.techName ? `
                <button class="report-btn">回報</button>
            ` : ''}
            </div>
        `).join('');
    }

    // 渲染技師列表
    function renderTechnicianList() {
        technicianList.innerHTML = db.technicians.map(tech => `
            <div class="technician-item" data-id="${tech.id}">
                <h3>${tech.name}</h3>
                <p>待處理維修單: ${db.tickets.filter(t => t.technician === tech.name && t.status !== '完成').length}</p>
                <div class="assigned-tickets">
                    ${db.tickets.filter(t => t.technician === tech.name).map(t => `
                        <p>${t.name} - ${t.status}</p>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    // 顯示創建維修單表單
    function showCreateTicketForm() {
        const modal = document.getElementById('ticket-modal');
        const form = document.getElementById('ticket-form');
        const cancelBtn = document.getElementById('cancel-ticket');
        
        // 重置表單
        form.reset();
        
        // 顯示彈窗
        modal.style.display = 'flex';
        
        // 取消按鈕事件
        cancelBtn.onclick = function() {
            modal.style.display = 'none';
        };
    }

    // 搜索維修單
    function searchTickets() {
        const searchTerm = document.getElementById('search-ticket').value.toLowerCase();
        if (!searchTerm) {
            renderTicketList();
            return;
        }
        
        const filteredTickets = db.tickets.filter(ticket => 
            ticket.name.toLowerCase().includes(searchTerm)
        );
        renderTicketList(filteredTickets);
    }

    // 設置事件監聽
    function setupEventListeners() {
        createTicketBtn.addEventListener('click', showCreateTicketForm);
        document.getElementById('search-btn').addEventListener('click', searchTickets);
        document.getElementById('search-ticket').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchTickets();
            }
        });
        
        // 委派事件處理
        ticketList.addEventListener('click', handleTicketActions);
        
        // 新增表單提交事件（确保只绑定一次）
        const ticketForm = document.getElementById('ticket-form');
        ticketForm.removeEventListener('submit', handleTicketFormSubmit); // 先移除旧的
        ticketForm.addEventListener('submit', handleTicketFormSubmit);
    }

    // 處理維修單表單提交
    function handleTicketFormSubmit(e) {
        e.preventDefault();
        
        const customer = document.getElementById('customer-name').value;
        const issue = document.getElementById('issue-desc').value;
        
        if (!customer || !issue) {
            alert('請填寫所有欄位');
            return;
        }
        
        const ticketName = document.getElementById('ticket-name').value;
        const createTime = document.getElementById('create-time').value || new Date().toISOString().slice(0, 16);
        
        const newTicket = {
            id: db.tickets.length + 1,
            name: ticketName,
            customer,
            issue,
            status: '待處理',
            technician: null,
            createdAt: createTime,
            updatedAt: new Date().toLocaleString()
        };
        
        db.tickets.push(newTicket);
        saveToLocalStorage();
        renderTicketList();
        
        // 隱藏彈窗並重置表單
        document.getElementById('ticket-modal').style.display = 'none';
        document.getElementById('ticket-form').reset();
        
        alert(`維修單 #${newTicket.id} 已建立`);
    }

    // 處理維修單操作
    function handleTicketActions(e) {
        const ticketItem = e.target.closest('.ticket-item');
        if (!ticketItem) return;
        
        const ticketId = parseInt(ticketItem.dataset.id);
        const ticket = db.tickets.find(t => t.id === ticketId);
        
        if (e.target.classList.contains('edit-btn')) {
            editTicket(ticket);
        } else if (e.target.classList.contains('delete-btn')) {
            deleteTicket(ticketId);
        } else if (e.target.classList.contains('assign-btn')) {
            assignTechnician(ticket);
        } else if (e.target.classList.contains('report-btn')) {
            reportTicket(ticket);
        }
    }

    // 編輯維修單
    function editTicket(ticket) {
        const modal = document.getElementById('edit-modal');
        const form = document.getElementById('edit-form');
        const cancelBtn = document.getElementById('cancel-edit');
        
        // 填充表單數據
        document.getElementById('edit-ticket-name').value = ticket.name;
        document.getElementById('edit-customer-name').value = ticket.customer;
        document.getElementById('edit-issue-desc').value = ticket.issue;
        
        // 顯示彈窗
        modal.style.display = 'flex';
        
        // 取消按鈕事件
        cancelBtn.onclick = function() {
            modal.style.display = 'none';
        };
        
        // 表單提交事件
        form.onsubmit = function(e) {
            e.preventDefault();
            
            ticket.name = document.getElementById('edit-ticket-name').value;
            ticket.customer = document.getElementById('edit-customer-name').value;
            ticket.issue = document.getElementById('edit-issue-desc').value;
            ticket.updatedAt = new Date().toLocaleString();
            
            saveToLocalStorage();
            renderTicketList();
            modal.style.display = 'none';
            alert('維修單已更新');
        };
    }

    // 刪除維修單
    function deleteTicket(ticketId) {
        const modal = document.getElementById('delete-modal');
        const confirmBtn = document.getElementById('confirm-delete');
        const cancelBtn = document.getElementById('cancel-delete');
        
        // 顯示彈窗
        modal.style.display = 'flex';
        
        // 取消按鈕事件
        cancelBtn.onclick = function() {
            modal.style.display = 'none';
        };
        
        // 確認刪除事件
        confirmBtn.onclick = function() {
            db.tickets = db.tickets.filter(t => t.id !== ticketId);
            saveToLocalStorage();
            renderTicketList();
            renderTechnicianList(); // 同步更新技师列表
            modal.style.display = 'none';
            alert('維修單已刪除');
        };
    }

    // 当前处理的维修单
    let currentAssignTicket = null;

    // 指派技師
    function assignTechnician(ticket) {
        currentAssignTicket = ticket;
        const modal = document.getElementById('assign-modal');
        const form = document.getElementById('assign-form');
        const cancelBtn = document.getElementById('cancel-assign');
        const techSelect = document.getElementById('assign-tech');
        
        // 设置当前指派的技师
        techSelect.value = ticket.technician || '';
        
        // 显示弹窗
        modal.style.display = 'flex';
        
        // 取消按钮事件
        cancelBtn.onclick = function() {
            modal.style.display = 'none';
            currentAssignTicket = null;
        };
        
        // 表单提交事件
        form.onsubmit = function(e) {
            e.preventDefault();
            
            const techName = techSelect.value;
            if (!techName) {
                alert('請選擇技師');
                return;
            }
            
            const selectedTech = db.technicians.find(t => t.name === techName);
            if (selectedTech) {
                currentAssignTicket.technician = selectedTech.name;
                currentAssignTicket.status = '已指派';
                saveToLocalStorage();
                renderTicketList();
                renderTechnicianList();
                modal.style.display = 'none';
                alert(`已指派 ${selectedTech.name} 負責此維修單`);
                currentAssignTicket = null;
            } else {
                alert('找不到指定的技師，請確認選擇正確');
            }
        };
    }

    // 当前处理的维修单
    let currentReportTicket = null;

    // 回報維修單
    function reportTicket(ticket) {
        currentReportTicket = ticket;
        const modal = document.getElementById('report-modal');
        const form = document.getElementById('report-form');
        const cancelBtn = document.getElementById('cancel-report');
        
        // 重置表单
        form.reset();
        document.getElementById('report-time').value = new Date().toISOString().slice(0, 16);
        
        // 显示弹窗
        modal.style.display = 'flex';
        
        // 取消按钮事件
        cancelBtn.onclick = function() {
            modal.style.display = 'none';
            currentReportTicket = null;
        };
        
        // 表单提交事件
        form.onsubmit = function(e) {
            e.preventDefault();
            
            const status = document.getElementById('report-status').value;
            const reportTime = document.getElementById('report-time').value;
            const notes = document.getElementById('report-notes').value;
            
            if (!status) {
                alert('請選擇維修狀態');
                return;
            }
            
            currentReportTicket.status = status;
            currentReportTicket.updatedAt = new Date().toLocaleString();
            currentReportTicket.reportTime = reportTime;
            currentReportTicket.notes = notes;
            
            saveToLocalStorage();
            renderTicketList();
            modal.style.display = 'none';
            alert('維修單已回報');
            currentReportTicket = null;
        };
    }

    // 啟動應用
    init();
});
