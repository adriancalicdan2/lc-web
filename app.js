import { firebaseService } from './firebase.js';

let currentUser = null;
let allRequestsData = [];
let employeesData = [];
let teamLeaderRequestsData = [];
let departmentRequestsData = [];

// PAGINATION STATE
let currentRequestPage = 1;
const requestsPerPage = 10; 
let currentEmployeePage = 1;
const employeesPerPage = 10;

// Pagination state for specific views
let myRequestsPage = 1;
let operationsRequestsPage = 1;
let headRequestsPage = 1;

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();

    // Dynamic Overtime Form Listeners
    const overtimeTypeSelect = document.getElementById('overtimeType');
    const teamLeaderOvertimeTypeSelect = document.getElementById('teamLeaderOvertimeType');
    
    if (overtimeTypeSelect) {
        overtimeTypeSelect.addEventListener('change', function() {
            toggleOvertimeInputs(this.value, 'standardOvertimeInputs', 'changeOffInputs');
        });
    }
    
    if (teamLeaderOvertimeTypeSelect) {
        teamLeaderOvertimeTypeSelect.addEventListener('change', function() {
            toggleOvertimeInputs(this.value, 'teamLeaderStandardOvertimeInputs', 'teamLeaderChangeOffInputs');
        });
    }
});

function toggleOvertimeInputs(value, standardId, changeOffId) {
    const standardInputs = document.getElementById(standardId);
    const changeOffInputs = document.getElementById(changeOffId);
    
    if (value === 'Shift Swap') {
        standardInputs.style.display = 'none';
        changeOffInputs.style.display = 'block';
    } else {
        standardInputs.style.display = 'block';
        changeOffInputs.style.display = 'none';
    }
}

// Update position options based on department
window.updatePositionOptions = function() {
    const department = document.getElementById('employeeDepartment').value;
    const positionSelect = document.getElementById('employeePositionSelect');
    const positionInput = document.getElementById('employeePositionInput');
    
    // Reset display
    positionSelect.style.display = 'none';
    positionInput.style.display = 'none';
    positionSelect.innerHTML = '<option value="">Select Position/选择职位</option>';
    
    // Only Operations and Back Office use the dropdown
    if (department === 'Operations') {
        const operationsPositions = [
            'PURCHASING', 'LOCKER', 'SERVICE', 'FRONTDESK/CASHIER/ODHOST',
            'USHERETTE', 'ROOM ATTENDANT', 'PUBLIC ATTENDANT', 'MAINTENANCE'
        ];
        operationsPositions.forEach(pos => {
            const option = document.createElement('option');
            option.value = pos;
            option.textContent = pos;
            positionSelect.appendChild(option);
        });
        positionSelect.style.display = 'block';
        positionSelect.required = true;
        positionInput.required = false;

    } else if (department === 'Back Office') {
        const backOfficePositions = [
            'WAREHOUSE', 'ADMIN/DRIVER', 'HR', 'FINANCE', 'MARKETING'
        ];
        backOfficePositions.forEach(pos => {
            const option = document.createElement('option');
            option.value = pos;
            option.textContent = pos;
            positionSelect.appendChild(option);
        });
        positionSelect.style.display = 'block';
        positionSelect.required = true;
        positionInput.required = false;

    } else {
        // For Therapist, Technical, Kitchen, etc., use manual input
        positionInput.style.display = 'block';
        positionInput.required = true;
        positionSelect.required = false;
    }
}

function initializeApp() {
    // Login form handler
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Employee management event listeners
    document.getElementById('addEmployeeBtn').addEventListener('click', showAddEmployeeForm);
    document.getElementById('employeeForm').addEventListener('submit', handleEmployeeSubmit);
    
    // Listen for auth state changes
    firebaseService.onAuthStateChanged(async (user) => {
        const loginBtn = document.querySelector('#loginForm button[type="submit"]');
        if (loginBtn) {
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Sign In/登录';
            loginBtn.disabled = false;
        }
        
        if (user) {
            try {
                const employee = await firebaseService.getEmployeeByEmail(user.email);
                if (employee) {
                    currentUser = {
                        uid: user.uid,
                        email: user.email,
                        ...employee
                    };
                    showAppPage();
                } else {
                    await firebaseService.logoutUser();
                    showMessage('Error/错误', 'Employee record not found. Please contact HR./未找到员工记录，请联系人力资源。');
                }
            } catch (error) {
                console.error('Auth state error:', error);
            }
        } else {
            currentUser = null;
            showLoginPage();
        }
    });
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Signing in.../登录中...';
    submitBtn.disabled = true;
    
    try {
        await firebaseService.loginUser(email, password);
    } catch (error) {
        console.error('Login error:', error);
        let errorMessage = 'Login failed. Please try again./登录失败，请重试。';
        if (error.code === 'auth/invalid-credential') errorMessage = 'Invalid email or password./无效的邮箱或密码。';
        else if (error.code === 'auth/too-many-requests') errorMessage = 'Too many failed attempts. Please try again later./尝试次数过多，请稍后重试。';
        else if (error.code === 'auth/user-not-found') errorMessage = 'No account found with this email./未找到此邮箱的账户。';
        else if (error.code === 'auth/wrong-password') errorMessage = 'Incorrect password./密码错误。';
        
        showMessage('Login Failed/登录失败', errorMessage);
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

function showLoginPage() {
    document.getElementById('loginPage').style.display = 'block';
    document.getElementById('appPage').style.display = 'none';
    document.getElementById('loginForm').reset();
}

function showAppPage() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('appPage').style.display = 'block';
    document.getElementById('userWelcome').textContent = `Welcome, ${currentUser.name}/欢迎, ${currentUser.name}`;
    
    const welcomeTitle = document.getElementById('welcomeTitle');
    const welcomeSubtitle = document.getElementById('welcomeSubtitle');
    
    const isTeamLeader = currentUser.role === 'Team Leader';
    
    if (isTeamLeader) {
        welcomeTitle.textContent = `Team Leader Portal/团队领导门户`;
        welcomeSubtitle.textContent = 'View Operations Department requests and manage your own schedule/查看运营部请求并管理您自己的日程';
        document.getElementById('employeeView').style.display = 'none';
        document.getElementById('headView').style.display = 'none';
        document.getElementById('hrView').style.display = 'none';
        document.getElementById('teamLeaderView').style.display = 'block';
        initializeTeamLeaderView();
    } else if (currentUser.role === 'Employee') {
        welcomeTitle.textContent = `Welcome to Your Spa Portal, ${currentUser.name}/欢迎来到您的SPA门户, ${currentUser.name}`;
        welcomeSubtitle.textContent = 'Manage your schedule, request time off, and view your requests/管理您的日程、请假并查看您的请求';
        document.getElementById('employeeView').style.display = 'block';
        document.getElementById('headView').style.display = 'none';
        document.getElementById('hrView').style.display = 'none';
        document.getElementById('teamLeaderView').style.display = 'none';
        initializeEmployeeView();
    } else if (currentUser.role === 'Head') {
        welcomeTitle.textContent = `Team Management Portal/团队管理门户`;
        welcomeSubtitle.textContent = `Review and manage requests for the ${currentUser.department} team/审阅和管理${currentUser.department}团队的请求`;
        document.getElementById('employeeView').style.display = 'none';
        document.getElementById('headView').style.display = 'block';
        document.getElementById('hrView').style.display = 'none';
        document.getElementById('teamLeaderView').style.display = 'none';
        initializeHeadView();
    } else if (currentUser.role === 'HR') {
        welcomeTitle.textContent = `Spa Management Dashboard/SPA管理仪表板`;
        welcomeSubtitle.textContent = 'Manage all staff members and review system-wide requests/管理所有员工并审阅全系统请求';
        document.getElementById('employeeView').style.display = 'none';
        document.getElementById('headView').style.display = 'none';
        document.getElementById('hrView').style.display = 'block';
        document.getElementById('teamLeaderView').style.display = 'none';
        initializeHRView();
    }
}

async function logout() {
    if (confirm('Are you sure you want to logout?/您确定要退出吗？')) {
        try { await firebaseService.logoutUser(); } 
        catch (error) { console.error('Logout error:', error); }
    }
}

function showHelp() { 
    showMessage('Need Help?/需要帮助？', 'For technical support or login issues, please contact HR Department./如需技术支持或登录问题，请联系人力资源部。'); 
}

function showMessage(title, message) {
    document.getElementById('messageModalTitle').textContent = title;
    document.getElementById('messageModalBody').textContent = message;
    const modal = new bootstrap.Modal(document.getElementById('messageModal'));
    modal.show();
}

// ==========================================
// GENERIC PAGINATION HELPER
// ==========================================
function renderPaginationHTML(currentPage, totalPages, changePageFunction) {
    if (totalPages <= 1) return '';

    return `
        <nav class="mt-3">
            <ul class="pagination justify-content-center">
                <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" onclick="${changePageFunction}(-1); return false;">Prev/上一页</a>
                </li>
                <li class="page-item disabled">
                    <span class="page-link">${currentPage} / ${totalPages}</span>
                </li>
                <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                    <a class="page-link" href="#" onclick="${changePageFunction}(1); return false;">Next/下一页</a>
                </li>
            </ul>
        </nav>
    `;
}

// ==========================================
// TEAM LEADER VIEW FUNCTIONS
// ==========================================
function initializeTeamLeaderView() {
    loadOperationsRequests();
    loadTeamLeaderMyRequests();
    const teamLeaderOvertimeType = document.getElementById('teamLeaderOvertimeType');
    if (teamLeaderOvertimeType) {
        teamLeaderOvertimeType.addEventListener('change', function() {
            toggleOvertimeInputs(this.value, 'teamLeaderStandardOvertimeInputs', 'teamLeaderChangeOffInputs');
        });
    }
}

async function submitTeamLeaderLeaveRequest() { await submitLeaveRequestCommon('teamLeader'); }
async function submitTeamLeaderOvertimeRequest() { await submitOvertimeRequestCommon('teamLeader'); }
function clearTeamLeaderLeaveForm() { clearLeaveFormCommon('teamLeader'); }
function clearTeamLeaderOvertimeForm() { clearOvertimeFormCommon('teamLeader'); }

async function loadOperationsRequests() {
    const container = document.getElementById('teamLeaderRequestsContainer');
    const paginationContainer = document.getElementById('teamLeaderRequestsPaginationContainer');
    
    container.innerHTML = `<div class="spinner-border text-primary"></div>`;
    
    try {
        teamLeaderRequestsData = await firebaseService.getOperationsDepartmentRequests();
        
        if (teamLeaderRequestsData.length === 0) {
            container.innerHTML = '<div class="text-center py-5">No requests found in Operations Department/运营部未找到请求</div>';
            paginationContainer.innerHTML = '';
            return;
        }

        const totalPages = Math.ceil(teamLeaderRequestsData.length / requestsPerPage);
        if (operationsRequestsPage > totalPages) operationsRequestsPage = totalPages;
        if (operationsRequestsPage < 1) operationsRequestsPage = 1;

        const pageRequests = teamLeaderRequestsData.slice((operationsRequestsPage - 1) * requestsPerPage, operationsRequestsPage * requestsPerPage);
        
        let html = `
            <div class="table-responsive">
                <table class="table table-hover mobile-friendly">
                    <thead class="table-light">
                        <tr>
                            <th>Employee/员工</th>
                            <th>Position/职位</th>
                            <th>Type/类型</th>
                            <th>Details/详情</th>
                            <th>Dates/日期</th>
                            <th>Status/状态</th>
                            <th>Action By/操作人</th>
                            <th>Submitted/提交时间</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        pageRequests.forEach(request => {
            const statusClass = getStatusBadgeClass(request.status);
            let dateDisplay;
            if (request.adjustmentType === 'Shift Swap') {
                dateDisplay = `<div class="small text-muted">Orig Off:</div><strong>${formatDate(request.startDate)}</strong><div class="small text-muted mt-1">New Off:</div><strong>${formatDate(request.endDate)}</strong>`;
            } else {
                dateDisplay = `${formatDate(request.startDate)} to ${formatDate(request.endDate)}`;
            }
            
            html += `
                <tr>
                    <td><strong>${request.employeeName}</strong><div class="small text-muted">${request.employeeId}</div></td>
                    <td><span class="badge bg-light text-dark">${request.position}</span></td>
                    <td><span class="badge ${request.type === 'Leave' ? 'bg-info' : 'bg-warning'}">${request.type}</span><div class="small text-muted mt-1">${request.leaveType || request.adjustmentType}</div></td>
                    <td><div class="small">${request.reason || '-'}</div>${request.cancellationRequested ? `<div class="small text-warning mt-1"><i class="fas fa-exclamation-triangle"></i> Cancellation Requested</div>` : ''}</td>
                    <td><div class="small">${dateDisplay}</div></td>
                    <td><span class="badge ${statusClass}">${request.status}</span></td>
                    <td><small class="text-muted">${request.approvedBy || '-'}</small></td>
                    <td><small>${formatDate(request.submissionDate)}</small></td>
                </tr>
            `;
        });
        
        html += `</tbody></table></div>`;
        container.innerHTML = html;
        paginationContainer.innerHTML = renderPaginationHTML(operationsRequestsPage, totalPages, 'changeOperationsPage');
    } catch (error) {
        container.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
        paginationContainer.innerHTML = '';
    }
}

window.changeOperationsPage = function(delta) {
    operationsRequestsPage += delta;
    loadOperationsRequests();
};

async function loadTeamLeaderMyRequests() {
    const container = document.getElementById('teamLeaderMyRequestsContainer');
    const paginationContainer = document.getElementById('teamLeaderMyRequestsPaginationContainer');
    await loadMyRequestsCommon(container, paginationContainer);
}

// ==========================================
// EMPLOYEE VIEW FUNCTIONS
// ==========================================
function initializeEmployeeView() { loadMyRequests(); }

async function loadMyRequests() {
    const container = document.getElementById('myRequestsContainer');
    const paginationContainer = document.getElementById('myRequestsPaginationContainer');
    await loadMyRequestsCommon(container, paginationContainer);
}

async function loadMyRequestsCommon(container, paginationContainer) {
    container.innerHTML = `<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>`;
    
    try {
        const [leaveRequests, overtimeRequests] = await Promise.all([
            firebaseService.getLeaveRequestsByEmployee(currentUser.employeeId),
            firebaseService.getOvertimeRequestsByEmployee(currentUser.employeeId)
        ]);
        
        let allRequests = [...leaveRequests, ...overtimeRequests].sort((a, b) => {
            const dateA = a.submissionDate?.toDate ? a.submissionDate.toDate() : new Date(a.submissionDate);
            const dateB = b.submissionDate?.toDate ? b.submissionDate.toDate() : new Date(b.submissionDate);
            return dateB - dateA;
        });
        
        if (allRequests.length === 0) {
            container.innerHTML = `<div class="text-center py-5"><h5 class="text-muted">No Requests Found/未找到请求</h5></div>`;
            if(paginationContainer) paginationContainer.innerHTML = '';
            return;
        }

        const totalPages = Math.ceil(allRequests.length / requestsPerPage);
        if (myRequestsPage > totalPages) myRequestsPage = totalPages;
        if (myRequestsPage < 1) myRequestsPage = 1;

        const pageRequests = allRequests.slice((myRequestsPage - 1) * requestsPerPage, myRequestsPage * requestsPerPage);
        
        let html = `
            <div class="table-responsive">
                <table class="table table-hover mobile-friendly">
                    <thead class="table-light">
                        <tr>
                            <th>Type/类型</th>
                            <th>Details/详情</th>
                            <th>Dates/日期</th>
                            <th>Duration/时长</th>
                            <th>Status/状态</th>
                            <th>Action By/操作人</th>
                            <th>Actions/操作</th>
                            <th>Submitted/提交时间</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        pageRequests.forEach(request => {
            const statusClass = getStatusBadgeClass(request.status);
            let dateDisplay, durationDisplay;
            if (request.adjustmentType === 'Shift Swap') {
                dateDisplay = `<div class="small text-muted">Orig Off:</div><strong>${formatDate(request.startDate)}</strong><div class="small text-muted mt-1">New Off:</div><strong>${formatDate(request.endDate)}</strong>`;
                durationDisplay = `<span class="badge bg-secondary">Swap</span>`;
            } else {
                dateDisplay = `${formatDate(request.startDate)} to ${formatDate(request.endDate)}`;
                durationDisplay = request.type === 'Leave' ? `<strong>${request.totalDays} days</strong>` : `<strong>${request.totalHours} hrs</strong>`;
            }

            let showCancelButton = false;
            const isActive = request.status !== 'Cancelled' && request.status !== 'Rejected';
            const isNotPendingCancel = !request.cancellationRequested;

            if (isActive && isNotPendingCancel) {
                if (request.status === 'Pending') {
                    showCancelButton = true;
                } else if (request.status === 'Approved') {
                    if (request.type === 'Overtime') {
                        showCancelButton = true;
                    } else if (request.type === 'Leave') {
                        const endDate = new Date(request.endDate);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        if (endDate >= today) showCancelButton = true;
                    }
                }
            }
            
            html += `
                <tr>
                    <td><span class="badge ${request.type === 'Leave' ? 'bg-info' : 'bg-warning'}">${request.type}</span><div class="small text-muted mt-1">${request.leaveType || request.adjustmentType}</div></td>
                    <td><div class="small">${request.reason || '-'}</div>${request.cancellationRequested ? `<div class="small text-warning mt-1"><i class="fas fa-exclamation-triangle"></i> Cancellation Requested</div>` : ''}${request.status === 'Cancelled' ? `<div class="small text-muted mt-1">Cancelled: ${request.cancellationReason || '-'}</div>` : ''}</td>
                    <td><div class="small">${dateDisplay}</div></td>
                    <td>${durationDisplay}</td>
                    <td><span class="badge ${statusClass}">${request.status}</span></td>
                    <td><small class="text-muted">${request.approvedBy || '-'}</small></td>
                    <td>${showCancelButton ? `<button class="btn btn-outline-warning btn-sm" onclick="showCancelModal('${request.id}', '${request.type}')"><i class="fas fa-times me-1"></i>Cancel</button>` : ''}</td>
                    <td><small>${formatDate(request.submissionDate)}</small></td>
                </tr>
            `;
        });
        
        html += `</tbody></table></div>`;
        container.innerHTML = html;
        if(paginationContainer) paginationContainer.innerHTML = renderPaginationHTML(myRequestsPage, totalPages, 'changeMyRequestsPage');
    } catch (error) {
        container.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
        if(paginationContainer) paginationContainer.innerHTML = '';
    }
}

window.changeMyRequestsPage = function(delta) {
    myRequestsPage += delta;
    if (currentUser.role === 'Team Leader') loadTeamLeaderMyRequests();
    else loadMyRequests();
};

async function submitLeaveRequest() { await submitLeaveRequestCommon(''); }
async function submitOvertimeRequest() { await submitOvertimeRequestCommon(''); }
function clearLeaveForm() { clearLeaveFormCommon(''); }
function clearOvertimeForm() { clearOvertimeFormCommon(''); }

async function submitLeaveRequestCommon(prefix) {
    const idPrefix = prefix ? 'teamLeaderLeave' : 'leave';
    const leaveType = document.getElementById(idPrefix + 'Type').value;
    const startDate = document.getElementById(idPrefix + 'StartDate').value;
    const endDate = document.getElementById(idPrefix + 'EndDate').value;
    const reason = document.getElementById(idPrefix + 'Reason').value;
    
    if (!leaveType || !startDate || !endDate || !reason) {
        showMessage('Error/错误', 'Please fill in all required fields./请填写所有必填字段。');
        return;
    }
    
    const startObj = new Date(startDate);
    const endObj = new Date(endDate);
    if (endObj < startObj) {
        showMessage('Invalid Dates/无效日期', 'End date cannot be earlier than start date./结束日期不能早于开始日期。');
        return;
    }
    
    const diffTime = Math.abs(endObj - startObj);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    const requestData = {
        employeeName: currentUser.name,
        employeeId: currentUser.employeeId,
        department: currentUser.department,
        position: currentUser.position,
        leaveType: leaveType,
        startDate: startDate,
        endDate: endDate,
        totalDays: totalDays,
        reason: reason,
    };
    
    try {
        await firebaseService.submitLeaveRequest(requestData);
        showMessage('Success/成功', 'Leave request submitted successfully!/请假请求提交成功！');
        if (prefix) clearTeamLeaderLeaveForm(); else clearLeaveForm();
        
        if (currentUser.role === 'Team Leader') {
            loadTeamLeaderMyRequests();
            loadOperationsRequests();
        } else {
            loadMyRequests();
        }
    } catch (error) {
        showMessage('Error/错误', 'Failed to submit request: ' + error.message);
    }
}

async function submitOvertimeRequestCommon(prefix) {
    const idPrefix = prefix ? 'teamLeader' : '';
    const typeId = idPrefix ? idPrefix + 'OvertimeType' : 'overtimeType';
    const reasonId = idPrefix ? idPrefix + 'OvertimeReason' : 'overtimeReason';
    const startId = idPrefix ? idPrefix + 'OvertimeStartDate' : 'overtimeStartDate';
    const endId = idPrefix ? idPrefix + 'OvertimeEndDate' : 'overtimeEndDate';
    const origId = idPrefix ? idPrefix + 'OriginalOffDate' : 'originalOffDate';
    const newId = idPrefix ? idPrefix + 'NewOffDate' : 'newOffDate';

    const adjustmentType = document.getElementById(typeId).value;
    const reason = document.getElementById(reasonId).value;
    
    let startDate, endDate, totalHours;

    if (adjustmentType === 'Shift Swap') {
        startDate = document.getElementById(origId).value;
        endDate = document.getElementById(newId).value;
        if (!startDate || !endDate || !reason) {
            showMessage('Error/错误', 'Please fill in Original Off Date, New Off Date, and Reason./请填写原定休息日、新休息日和原因。');
            return;
        }
        totalHours = 0;
    } else {
        startDate = document.getElementById(startId).value;
        endDate = document.getElementById(endId).value;
        if (!startDate || !endDate || !reason) {
            showMessage('Error/错误', 'Please fill in all required fields./请填写所有必填字段。');
            return;
        }
        const startObj = new Date(startDate);
        const endObj = new Date(endDate);
        if (endObj < startObj) {
            showMessage('Invalid Times/无效时间', 'End time cannot be earlier than start time./结束时间不能早于开始时间。');
            return;
        }
        const diffTime = Math.abs(endObj - startObj);
        totalHours = parseFloat((diffTime / (1000 * 60 * 60)).toFixed(2));
    }
    
    const requestData = {
        employeeName: currentUser.name,
        employeeId: currentUser.employeeId,
        department: currentUser.department,
        position: currentUser.position,
        adjustmentType: adjustmentType,
        startDate: startDate,
        endDate: endDate,
        totalHours: totalHours,
        reason: reason,
    };
    
    try {
        await firebaseService.submitOvertimeRequest(requestData);
        showMessage('Success/成功', 'Request submitted successfully!/请求提交成功！');
        if (prefix) clearTeamLeaderOvertimeForm(); else clearOvertimeForm();
        
        if (currentUser.role === 'Team Leader') {
            loadTeamLeaderMyRequests();
            loadOperationsRequests();
        } else {
            loadMyRequests();
        }
    } catch (error) {
        showMessage('Error/错误', 'Failed to submit request: ' + error.message);
    }
}

function clearLeaveFormCommon(prefix) {
    const idPrefix = prefix ? 'teamLeaderLeave' : 'leave';
    document.getElementById(idPrefix + 'Type').value = '';
    document.getElementById(idPrefix + 'StartDate').value = '';
    document.getElementById(idPrefix + 'EndDate').value = '';
    document.getElementById(idPrefix + 'Reason').value = '';
}

function clearOvertimeFormCommon(prefix) {
    const idPrefix = prefix ? 'teamLeader' : '';
    const typeId = idPrefix ? idPrefix + 'OvertimeType' : 'overtimeType';
    
    document.getElementById(typeId).value = 'Overtime';
    document.getElementById(idPrefix ? idPrefix + 'OvertimeStartDate' : 'overtimeStartDate').value = '';
    document.getElementById(idPrefix ? idPrefix + 'OvertimeEndDate' : 'overtimeEndDate').value = '';
    document.getElementById(idPrefix ? idPrefix + 'OriginalOffDate' : 'originalOffDate').value = '';
    document.getElementById(idPrefix ? idPrefix + 'NewOffDate' : 'newOffDate').value = '';
    document.getElementById(idPrefix ? idPrefix + 'OvertimeReason' : 'overtimeReason').value = '';
    
    const event = new Event('change');
    document.getElementById(typeId).dispatchEvent(event);
}

// Cancel Request Modal
function showCancelModal(requestId, requestType) {
    const modal = new bootstrap.Modal(document.getElementById('cancelModal'));
    document.getElementById('cancelModal').setAttribute('data-request-id', requestId);
    document.getElementById('cancelModal').setAttribute('data-request-type', requestType);
    document.getElementById('cancelReason').value = '';
    modal.show();
}

async function submitCancellation() {
    const modal = document.getElementById('cancelModal');
    const requestId = modal.getAttribute('data-request-id');
    const requestType = modal.getAttribute('data-request-type');
    const reason = document.getElementById('cancelReason').value;
    
    if (!reason) { showMessage('Error', 'Please provide a reason.'); return; }
    
    try {
        await firebaseService.cancelRequest(requestId, requestType, reason);
        showMessage('Success', 'Cancellation submitted!');
        bootstrap.Modal.getInstance(modal).hide();
        loadMyRequests();
        if (currentUser.role === 'Team Leader') {
            loadTeamLeaderMyRequests();
            loadOperationsRequests();
        }
        if (currentUser.role === 'Head') { 
            loadDepartmentRequests(); 
            loadCancellationRequests(); 
        }
        else if (currentUser.role === 'HR') { 
            loadAllRequests(); 
            loadCancellationRequests(); 
        }
    } catch (error) { showMessage('Error', error.message); }
}

// ==========================================
// HEAD VIEW FUNCTIONS
// ==========================================
function initializeHeadView() {
    document.getElementById('headDepartment').textContent = `${currentUser.department}`;
    loadDepartmentRequests();
    loadCancellationRequests();

    document.getElementById('headPositionFilter').addEventListener('change', () => {
        headRequestsPage = 1;
        applyHeadFilters();
    });
    document.getElementById('clearHeadFilters').addEventListener('click', () => {
        document.getElementById('headPositionFilter').value = '';
        headRequestsPage = 1;
        applyHeadFilters();
    });
}

async function loadDepartmentRequests() {
    const container = document.getElementById('requestsContainer');
    container.innerHTML = `<div class="spinner-border text-primary"></div>`;
    
    try {
        let allDeptRequests = await firebaseService.getPendingRequestsByDepartment(currentUser.department);
        
        // CONDITIONAL FILTERING FOR HEADS
        if (currentUser.department === 'Back Office') {
            // Strict Mode: Only show requests that match Head's position
            departmentRequestsData = allDeptRequests.filter(req => req.position === currentUser.position);
        } else {
            // Loose Mode: Show all requests from the department
            departmentRequestsData = allDeptRequests;
        }
        
        // Populate position filter options dynamically based on data
        const positions = [...new Set(departmentRequestsData.map(r => r.position))].filter(Boolean).sort();
        const posFilter = document.getElementById('headPositionFilter');
        posFilter.innerHTML = '<option value="">All Positions/所有职位</option>';
        positions.forEach(pos => {
            const opt = document.createElement('option');
            opt.value = pos;
            opt.textContent = pos;
            posFilter.appendChild(opt);
        });

        applyHeadFilters();
    } catch (error) { 
        container.innerHTML = `<div class="alert alert-danger">${error.message}</div>`; 
    }
}

function applyHeadFilters() {
    const container = document.getElementById('requestsContainer');
    const paginationContainer = document.getElementById('headRequestsPaginationContainer');
    const posFilter = document.getElementById('headPositionFilter').value;
    
    let filtered = departmentRequestsData;
    if (posFilter) {
        filtered = filtered.filter(r => r.position === posFilter);
    }
    
    if (filtered.length === 0) { 
        container.innerHTML = '<div class="text-center py-5">No Pending Requests/没有待处理的请求</div>'; 
        paginationContainer.innerHTML = '';
        return; 
    }

    const totalPages = Math.ceil(filtered.length / requestsPerPage);
    if (headRequestsPage > totalPages) headRequestsPage = totalPages;
    if (headRequestsPage < 1) headRequestsPage = 1;

    const pageRequests = filtered.slice((headRequestsPage - 1) * requestsPerPage, headRequestsPage * requestsPerPage);

    let html = `
        <div class="table-responsive">
            <table class="table table-hover table-bordered mobile-friendly">
                <thead class="table-dark">
                    <tr>
                        <th>Employee/员工</th>
                        <th>Position/职位</th>
                        <th>Type/类型</th>
                        <th>Dates/Details/日期/详情</th>
                        <th>Reason/原因</th>
                        <th>Action By/操作人</th>
                        <th>Actions/操作</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    pageRequests.forEach(request => {
        let dateDisplay;
        if (request.adjustmentType === 'Shift Swap') {
            dateDisplay = `Original Off/原休息日: ${formatDate(request.startDate)}<br>New Off/新休息日: ${formatDate(request.endDate)}`;
        } else {
            dateDisplay = `${formatDate(request.startDate)} - ${formatDate(request.endDate)}`;
        }

        html += `
            <tr>
                <td><strong>${request.employeeName}</strong><br><small>${request.employeeId}</small></td>
                <td><span class="badge bg-light text-dark">${request.position}</span></td>
                <td>${request.type}<br><small>${request.leaveType || request.adjustmentType}</small></td>
                <td>${dateDisplay}<br><strong>${request.type === 'Leave' ? request.totalDays + ' days/天' : (request.adjustmentType === 'Shift Swap' ? 'Swap/调换' : request.totalHours + ' hrs/小时')}</strong></td>
                <td>${request.reason}</td>
                <td>${request.approvedBy || '-'}</td>
                <td>
                    <button class="btn btn-success btn-sm" onclick="approveRequest('${request.id}', '${request.type}')">Approve/批准</button>
                    <button class="btn btn-danger btn-sm" onclick="rejectRequest('${request.id}', '${request.type}')">Reject/拒绝</button>
                </td>
            </tr>
        `;
    });
    html += `</tbody></table></div>`;
    container.innerHTML = html;
    paginationContainer.innerHTML = renderPaginationHTML(headRequestsPage, totalPages, 'changeHeadPage');
}

window.changeHeadPage = function(delta) {
    headRequestsPage += delta;
    applyHeadFilters();
};

async function loadCancellationRequests() {
    if (currentUser.role !== 'Head' && currentUser.role !== 'HR') return;
    const containerId = currentUser.role === 'Head' ? 'cancellationRequestsContainer' : 'hrCancellationRequestsContainer';
    let container = document.getElementById(containerId);
    if (!container) return;
    
    try {
        let requests = await firebaseService.getCancellationRequests();
        if (currentUser.role === 'Head') {
            requests = requests.filter(r => r.department === currentUser.department);
            // Apply strict filter for cancellation requests as well for Back Office Heads
            if (currentUser.department === 'Back Office') {
                requests = requests.filter(r => r.position === currentUser.position);
            }
        } 
        
        if (requests.length === 0) { 
            container.innerHTML = '<div class="text-center py-3">No cancellation requests/没有取消请求</div>'; 
            return; 
        }
        
        let html = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead><tr><th>Request Details/请求详情</th><th>Actions/操作</th></tr></thead>
                    <tbody>
        `;
        
        requests.forEach(r => {
            html += `
                <tr>
                    <td><strong>${r.employeeName}</strong> - ${r.type}<br><small>Reason/原因: ${r.cancellationReason}</small></td>
                    <td>
                        <button onclick="approveCancellation('${r.id}','${r.type}')" class="btn btn-success btn-sm me-2">Approve/批准</button>
                        <button onclick="rejectCancellation('${r.id}','${r.type}')" class="btn btn-danger btn-sm">Reject/拒绝</button>
                    </td>
                </tr>
            `;
        });
        
        html += `</tbody></table></div>`;
        container.innerHTML = html;
    } catch (e) { 
        container.innerHTML = `<div class="alert alert-danger">${e.message}</div>`; 
    }
}

async function approveRequest(id, type) { 
    if(confirm('Approve this request?/批准此请求？')) { 
        await firebaseService.updateRequestStatus(id, 'Approved', type, currentUser.name); 
        if (currentUser.role === 'Head') {
            loadDepartmentRequests(); 
        } else if (currentUser.role === 'HR') {
            loadAllRequests();
            loadCancellationRequests();
        }
    } 
}

async function rejectRequest(id, type) { 
    if(confirm('Reject this request?/拒绝此请求？')) { 
        await firebaseService.updateRequestStatus(id, 'Rejected', type, currentUser.name); 
        if (currentUser.role === 'Head') {
            loadDepartmentRequests(); 
        } else if (currentUser.role === 'HR') {
            loadAllRequests();
            loadCancellationRequests();
        }
    } 
}

async function approveCancellation(id, type) { 
    if(confirm('Approve cancellation?/批准取消？')) { 
        await firebaseService.approveCancellation(id, type); 
        loadCancellationRequests(); 
        if (currentUser.role === 'Head') {
            loadDepartmentRequests(); 
        } else if (currentUser.role === 'HR') {
            loadAllRequests();
        }
    } 
}

async function rejectCancellation(id, type) { 
    if(confirm('Reject cancellation?/拒绝取消？')) { 
        await firebaseService.rejectCancellation(id, type); 
        loadCancellationRequests(); 
    } 
}

// ==========================================
// HR VIEW FUNCTIONS
// ==========================================
function initializeHRView() {
    loadAllRequests();
    loadEmployeeList();
    loadCancellationRequests();
    setupFilters();
    document.getElementById('downloadExcelBtn').addEventListener('click', showExcelModal);
    document.getElementById('confirmExcelDownload').addEventListener('click', generateExcelReport);
}

function setupFilters() {
    document.getElementById('searchName').addEventListener('input', () => { currentRequestPage = 1; applyFilters(); });
    document.getElementById('filterDepartment').addEventListener('change', () => { currentRequestPage = 1; applyFilters(); });
    document.getElementById('filterRequestType').addEventListener('change', () => { currentRequestPage = 1; applyFilters(); });
    document.getElementById('filterStatus').addEventListener('change', () => { currentRequestPage = 1; applyFilters(); });
    document.getElementById('startDateFilter').addEventListener('change', () => { currentRequestPage = 1; applyFilters(); });
    document.getElementById('endDateFilter').addEventListener('change', () => { currentRequestPage = 1; applyFilters(); });
    document.getElementById('clearFilters').addEventListener('click', clearFilters);
}

async function loadAllRequests() {
    const tbody = document.getElementById('allRequestsTable');
    tbody.innerHTML = `<tr><td colspan="10" class="text-center py-4">Loading.../加载中...</td></tr>`;
    try {
        allRequestsData = await firebaseService.getAllRequests();
        
        // SORT BY LATEST REQUEST (Submission Date Descending)
        allRequestsData.sort((a, b) => {
            const dateA = a.submissionDate?.toDate ? a.submissionDate.toDate() : new Date(a.submissionDate || 0);
            const dateB = b.submissionDate?.toDate ? b.submissionDate.toDate() : new Date(b.submissionDate || 0);
            return dateB - dateA;
        });

        currentRequestPage = 1;
        applyFilters();
    } catch (error) { 
        tbody.innerHTML = `<tr><td colspan="10" class="text-center text-danger">Error/错误: ${error.message}</td></tr>`; 
    }
}

function applyFilters() {
    const searchName = document.getElementById('searchName').value.toLowerCase();
    const department = document.getElementById('filterDepartment').value;
    const requestType = document.getElementById('filterRequestType').value;
    const status = document.getElementById('filterStatus').value;
    const startDate = document.getElementById('startDateFilter').value;
    const endDate = document.getElementById('endDateFilter').value;

    const filteredRequests = allRequestsData.filter(request => {
        if (searchName && !request.employeeName.toLowerCase().includes(searchName) && !request.employeeId.toLowerCase().includes(searchName)) return false;
        if (department && request.department !== department) return false;
        if (requestType && request.type !== requestType) return false;
        if (status && request.status !== status) return false;
        if (startDate && new Date(request.startDate) < new Date(startDate)) return false;
        if (endDate && new Date(request.endDate) > new Date(endDate)) return false;
        return true;
    });
    
    displayFilteredRequests(filteredRequests);
}

function displayFilteredRequests(requests) {
    const tbody = document.getElementById('allRequestsTable');
    const paginationContainer = document.getElementById('hrRequestsPaginationContainer');
    
    if (requests.length === 0) { 
        tbody.innerHTML = '<tr><td colspan="10" class="text-center py-4">No requests found/未找到请求</td></tr>'; 
        paginationContainer.innerHTML = '';
        return; 
    }

    const totalPages = Math.ceil(requests.length / requestsPerPage);
    if (currentRequestPage > totalPages) currentRequestPage = totalPages;
    if (currentRequestPage < 1) currentRequestPage = 1;

    const pageRequests = requests.slice((currentRequestPage - 1) * requestsPerPage, currentRequestPage * requestsPerPage);

    let html = '';
    pageRequests.forEach(request => {
        const statusClass = getStatusBadgeClass(request.status);
        let dateDisplay;
        if (request.adjustmentType === 'Shift Swap') {
            dateDisplay = `Orig/原: ${formatDate(request.startDate)}<br>New/新: ${formatDate(request.endDate)}`;
        } else {
            dateDisplay = `${formatDate(request.startDate)} to ${formatDate(request.endDate)}`;
        }

        let actionButtons = '';
        
        if (request.status === 'Pending') {
            actionButtons = `
                <button class="btn btn-success btn-sm mb-1" onclick="approveRequest('${request.id}', '${request.type}')">Approve/批准</button>
                <button class="btn btn-danger btn-sm mb-1" onclick="rejectRequest('${request.id}', '${request.type}')">Reject/拒绝</button>
            `;
        } else if (request.status === 'Approved' && !request.cancellationRequested) {
            actionButtons = `
                <button class="btn btn-warning btn-sm mb-1" onclick="showCancelModal('${request.id}', '${request.type}')">Cancel/取消</button>
            `;
        } else if (request.cancellationRequested) {
            actionButtons = `
                <button class="btn btn-success btn-sm mb-1" onclick="approveCancellation('${request.id}', '${request.type}')">Approve Cancel/批准取消</button>
                <button class="btn btn-danger btn-sm mb-1" onclick="rejectCancellation('${request.id}', '${request.type}')">Reject Cancel/拒绝取消</button>
            `;
        } else {
            actionButtons = '-';
        }

        html += `
            <tr>
                <td><input type="checkbox" class="request-checkbox" value="${request.id}" data-type="${request.type}"></td>
                <td>${request.employeeName}<br><small class="text-muted">${request.employeeId}</small></td>
                <td><span class="badge bg-light text-dark">${request.department}</span></td>
                <td>${request.position || '-'}</td>
                <td><span class="badge ${request.type === 'Leave' ? 'bg-info' : 'bg-warning'}">${request.type}</span><div class="small mt-1">${request.leaveType || request.adjustmentType}</div></td>
                <td><div class="small">${dateDisplay}</div></td>
                <td><span class="badge ${statusClass}">${request.status}</span></td>
                <td>${actionButtons}</td>
                <td><small class="text-muted">${request.approvedBy || '-'}</small></td>
                <td><small>${formatDate(request.submissionDate)}</small></td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    paginationContainer.innerHTML = renderPaginationHTML(currentRequestPage, totalPages, 'changeRequestPage');
}

window.changeRequestPage = function(delta) { 
    currentRequestPage += delta; 
    applyFilters(); 
};

// HR BULK DELETE FUNCTIONS
window.toggleSelectAll = function(source) {
    const checkboxes = document.querySelectorAll('.request-checkbox');
    checkboxes.forEach(cb => cb.checked = source.checked);
};

window.deleteSelectedRequests = async function() {
    const checkboxes = document.querySelectorAll('.request-checkbox:checked');
    if (checkboxes.length === 0) {
        showMessage('Info/信息', 'No requests selected./未选择请求。');
        return;
    }

    if (!confirm(`Are you sure you want to delete ${checkboxes.length} requests? This cannot be undone./您确定要删除 ${checkboxes.length} 个请求吗？此操作无法撤消。`)) return;

    const deletePromises = [];
    checkboxes.forEach(cb => {
        const id = cb.value;
        const type = cb.getAttribute('data-type');
        deletePromises.push(firebaseService.deleteRequest(id, type));
    });

    try {
        await Promise.all(deletePromises);
        showMessage('Success/成功', 'Selected requests deleted./已删除选定的请求。');
        loadAllRequests();
    } catch (error) {
        showMessage('Error/错误', 'Failed to delete some requests: ' + error.message);
    }
};

function clearFilters() {
    document.getElementById('searchName').value = '';
    document.getElementById('filterDepartment').value = '';
    document.getElementById('filterRequestType').value = '';
    document.getElementById('filterStatus').value = '';
    document.getElementById('startDateFilter').value = '';
    document.getElementById('endDateFilter').value = '';
    currentRequestPage = 1;
    applyFilters();
}

// Excel Functions
function showExcelModal() {
    const now = new Date();
    document.getElementById('excelStartDate').value = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    document.getElementById('excelEndDate').value = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    new bootstrap.Modal(document.getElementById('excelModal')).show();
}

async function generateExcelReport() {
    try {
        const startInput = document.getElementById('excelStartDate').value;
        const endInput = document.getElementById('excelEndDate').value;
        if (!startInput || !endInput) { 
            showMessage('Error/错误', 'Please select dates./请选择日期。'); 
            return; 
        }

        const filterStart = new Date(startInput); 
        filterStart.setHours(0, 0, 0, 0);
        const filterEnd = new Date(endInput); 
        filterEnd.setHours(23, 59, 59, 999);

        const exportData = allRequestsData.filter(req => {
            let reqDate;
            try { 
                reqDate = req.startDate.toDate ? req.startDate.toDate() : new Date(req.startDate); 
            } catch (e) { 
                reqDate = new Date(req.startDate); 
            }
            return reqDate >= filterStart && reqDate <= filterEnd;
        });

        if (exportData.length === 0) { 
            showMessage('No Data/无数据', 'No requests found in selected period./选定期间内未找到请求。'); 
            return; 
        }

        exportData.sort((a, b) => { 
            return new Date(a.startDate) - new Date(b.startDate); 
        });

        const excelRows = exportData.map(req => ({
            'Start Date/开始日期': formatDate(req.startDate),
            'End Date/结束日期': formatDate(req.endDate),
            'Employee Name/员工姓名': req.employeeName,
            'Employee ID/员工ID': req.employeeId,
            'Department/部门': req.department,
            'Position/职位': req.position,
            'Type/类型': req.type,
            'Category/类别': req.leaveType || req.adjustmentType,
            'Duration/时长': req.type === 'Leave' ? `${req.totalDays} days/天` : (req.adjustmentType === 'Shift Swap' ? 'Swap/调换' : `${req.totalHours} hours/小时`),
            'Reason/原因': req.reason || '',
            'Status/状态': req.status,
            'Approved By/批准人': req.approvedBy || '',
            'Submitted/提交时间': formatDate(req.submissionDate)
        }));

        const ws = XLSX.utils.json_to_sheet(excelRows);
        const headerStyle = { 
            fill: { fgColor: { rgb: "2E7D32" } }, 
            font: { color: { rgb: "FFFFFF" }, bold: true }, 
            alignment: { horizontal: "center" } 
        };
        
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell = ws[XLSX.utils.encode_cell({r: R, c: C})];
                if (!cell) continue;
                if (R === 0) cell.s = headerStyle;
            }
        }
        
        ws['!cols'] = [
            {wch: 15}, {wch: 15}, {wch: 20}, {wch: 10}, 
            {wch: 15}, {wch: 20}, {wch: 10}, {wch: 15}, 
            {wch: 10}, {wch: 30}, {wch: 10}, {wch: 15}, {wch: 15}
        ];
        
        const wb = XLSX.utils.book_new();
        // CHANGED: Replaced '/' with '_' in sheet name to avoid Excel error
        XLSX.utils.book_append_sheet(wb, ws, "Requests_请求");
        const filename = `LuoCitySpa_Requests_${startInput}_to_${endInput}.xlsx`;
        XLSX.writeFile(wb, filename);
        
        bootstrap.Modal.getInstance(document.getElementById('excelModal')).hide();
        showMessage('Success/成功', `Downloaded: ${filename}/已下载: ${filename}`);
    } catch (e) { 
        showMessage('Error/错误', e.message); 
    }
}

// ==========================================
// EMPLOYEE MANAGEMENT
// ==========================================

async function loadEmployeeList() {
    const container = document.getElementById('employeesContainer');
    container.innerHTML = `<div class="spinner-border text-primary"></div>`;
    
    // Attach Event Listeners for the new filters
    const searchInput = document.getElementById('employeeSearchInput');
    if (searchInput) {
        // Remove old listeners to prevent duplicates
        const newSearch = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newSearch, searchInput);
        newSearch.addEventListener('input', () => { 
            currentEmployeePage = 1; 
            applyEmployeeFilters(); 
        });

        document.getElementById('employeeDeptFilter').addEventListener('change', () => { 
            currentEmployeePage = 1; 
            applyEmployeeFilters(); 
        });
        document.getElementById('employeeSortFilter').addEventListener('change', () => { 
            currentEmployeePage = 1; 
            applyEmployeeFilters(); 
        });
        document.getElementById('clearEmployeeFilters').addEventListener('click', clearEmployeeFilters);
    }

    try {
        employeesData = await firebaseService.getAllEmployees();
        currentEmployeePage = 1;
        applyEmployeeFilters();
    } catch (error) { 
        container.innerHTML = `<div class="alert alert-danger">${error.message}</div>`; 
    }
}

function applyEmployeeFilters() {
    const searchTerm = document.getElementById('employeeSearchInput').value.toLowerCase();
    const deptFilter = document.getElementById('employeeDeptFilter').value;
    const sortValue = document.getElementById('employeeSortFilter').value;

    let filteredEmployees = employeesData.filter(emp => {
        const matchesSearch = (emp.name.toLowerCase().includes(searchTerm) || emp.employeeId.toLowerCase().includes(searchTerm));
        const matchesDept = deptFilter === '' || emp.department === deptFilter;
        return matchesSearch && matchesDept;
    });

    filteredEmployees.sort((a, b) => {
        if (sortValue === 'id_asc') return a.employeeId.localeCompare(b.employeeId, undefined, { numeric: true });
        if (sortValue === 'id_desc') return b.employeeId.localeCompare(a.employeeId, undefined, { numeric: true });
        if (sortValue === 'date_newest') {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
            return dateB - dateA;
        }
        if (sortValue === 'date_oldest') {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
            return dateA - dateB;
        }
        return 0;
    });

    displayEmployees(filteredEmployees);
}

function clearEmployeeFilters() {
    document.getElementById('employeeSearchInput').value = '';
    document.getElementById('employeeDeptFilter').value = '';
    document.getElementById('employeeSortFilter').value = 'id_asc';
    currentEmployeePage = 1;
    applyEmployeeFilters();
}

function displayEmployees(employees) {
    const container = document.getElementById('employeesContainer');
    const paginationContainer = document.getElementById('employeesPaginationContainer');

    if (employees.length === 0) { 
        container.innerHTML = '<div class="text-center py-4 text-muted">No employees match your filters./没有匹配筛选条件的员工。</div>'; 
        paginationContainer.innerHTML = '';
        return; 
    }

    const totalPages = Math.ceil(employees.length / employeesPerPage);
    if (currentEmployeePage > totalPages) currentEmployeePage = totalPages;
    if (currentEmployeePage < 1) currentEmployeePage = 1;

    const pageEmployees = employees.slice((currentEmployeePage - 1) * employeesPerPage, currentEmployeePage * employeesPerPage);
    
    let html = `
        <div class="table-responsive">
            <table class="table table-hover mobile-friendly align-middle">
                <thead class="table-dark">
                    <tr>
                        <th>ID/编号</th>
                        <th>Name/姓名</th>
                        <th>Email/邮箱</th>
                        <th>Department/部门</th>
                        <th>Position/职位</th>
                        <th>Role/角色</th>
                        <th>Actions/操作</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    pageEmployees.forEach(employee => {
        html += `
            <tr>
                <td><strong>${employee.employeeId}</strong></td>
                <td>${employee.name}</td>
                <td>${employee.email}</td>
                <td><span class="badge bg-light text-dark">${employee.department}</span></td>
                <td><span class="badge bg-info text-white">${employee.position}</span></td>
                <td><span class="badge ${getRoleBadgeClass(employee.role)}">${employee.role}</span></td>
                <td>
                    <button class="btn btn-outline-primary btn-sm me-2" onclick="editEmployee('${employee.id}')">
                        <i class="fas fa-edit"></i> Edit/编辑
                    </button>
                    <button class="btn btn-outline-danger btn-sm" onclick="deleteEmployee('${employee.id}', '${employee.name}')">
                        <i class="fas fa-trash"></i> Delete/删除
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += `</tbody></table></div>`;
    container.innerHTML = html;
    paginationContainer.innerHTML = renderPaginationHTML(currentEmployeePage, totalPages, 'changeEmployeePage');
}

window.changeEmployeePage = function(delta) { 
    currentEmployeePage += delta; 
    applyEmployeeFilters(); 
};

async function editEmployee(employeeId) {
    try {
        const employee = await firebaseService.getEmployeeById(employeeId);
        if (!employee) {
            showMessage('Error/错误', 'Employee not found./未找到员工。');
            return;
        }
        
        document.getElementById('editEmployeeId').value = employeeId;
        document.getElementById('employeeFormTitle').textContent = 'Edit Employee/编辑员工';
        document.getElementById('employeeId').value = employee.employeeId;
        document.getElementById('employeeId').readOnly = true;
        document.getElementById('employeeName').value = employee.name;
        document.getElementById('employeeEmail').value = employee.email;
        document.getElementById('employeeDepartment').value = employee.department;
        
        // HIDE Password field for Edit
        document.getElementById('employeePasswordGroup').style.display = 'none';
        document.getElementById('employeePassword').required = false;
        document.getElementById('employeePassword').value = '';

        // Trigger position options update
        updatePositionOptions();
        
        // Set the position value
        setTimeout(() => {
            const positionSelect = document.getElementById('employeePositionSelect');
            const positionInput = document.getElementById('employeePositionInput');
            
            if (positionSelect.style.display !== 'none') {
                positionSelect.value = employee.position;
            } else if (positionInput.style.display !== 'none') {
                positionInput.value = employee.position;
            }
        }, 100);
        
        document.getElementById('employeeRole').value = employee.role;
        document.getElementById('employeeFormSubmitBtn').textContent = 'Update Employee/更新员工';
        
        new bootstrap.Modal(document.getElementById('employeeModal')).show();
    } catch (error) {
        showMessage('Error/错误', error.message);
    }
}

function showAddEmployeeForm() { 
    document.getElementById('employeeFormTitle').textContent = 'Add New Staff/添加新员工'; 
    document.getElementById('employeeForm').reset(); 
    document.getElementById('editEmployeeId').value = '';
    document.getElementById('employeeId').readOnly = false;
    
    // SHOW Password field for Add
    document.getElementById('employeePasswordGroup').style.display = 'block';
    document.getElementById('employeePassword').required = true;
    document.getElementById('employeePassword').placeholder = 'Set initial password/设置初始密码';
    
    document.getElementById('employeeFormSubmitBtn').textContent = 'Save Employee/保存员工';
    
    // Reset position options
    updatePositionOptions();
    
    new bootstrap.Modal(document.getElementById('employeeModal')).show(); 
}

async function handleEmployeeSubmit(e) { 
    e.preventDefault(); 
    const submitBtn = e.target.querySelector('button[type="submit"]'); 
    submitBtn.disabled = true; 
    
    const employeeId = document.getElementById('editEmployeeId').value;
    const department = document.getElementById('employeeDepartment').value;
    let position = '';
    
    const positionSelect = document.getElementById('employeePositionSelect');
    const positionInput = document.getElementById('employeePositionInput');
    
    // Determine which input to read from
    if (positionSelect.style.display !== 'none') {
        position = positionSelect.value;
    } else {
        position = positionInput.value;
    }
    
    const employeeData = { 
        employeeId: document.getElementById('employeeId').value, 
        name: document.getElementById('employeeName').value, 
        email: document.getElementById('employeeEmail').value, 
        department: department, 
        role: document.getElementById('employeeRole').value, 
        position: position 
    }; 
    
    const password = document.getElementById('employeePassword').value; 
    
    try { 
        if (employeeId) {
            // Update existing employee
            await firebaseService.updateEmployee(employeeId, employeeData, password);
            showMessage('Success/成功', 'Employee updated successfully!/员工更新成功！');
        } else {
            // Create new employee
            if (!password) {
                showMessage('Error/错误', 'Password is required for new employees./新员工需要密码。');
                submitBtn.disabled = false;
                return;
            }
            await firebaseService.createEmployee(employeeData, password);
            showMessage('Success/成功', 'Employee created successfully!/员工创建成功！');
        }
        
        bootstrap.Modal.getInstance(document.getElementById('employeeModal')).hide(); 
        loadEmployeeList(); 
    } catch (error) { 
        showMessage('Error/错误', error.message); 
    } finally { 
        submitBtn.disabled = false; 
    } 
}

async function deleteEmployee(employeeId, employeeName) { 
    if (confirm(`Delete ${employeeName}?/删除 ${employeeName}？`)) { 
        try { 
            await firebaseService.deleteEmployee(employeeId); 
            showMessage('Success/成功', 'Employee deleted successfully!/员工删除成功！'); 
            loadEmployeeList(); 
        } catch (error) { 
            showMessage('Error/错误', error.message); 
        } 
    } 
}

function getRoleBadgeClass(role) { 
    switch(role) { 
        case 'HR': return 'bg-danger'; 
        case 'Team Leader': return 'bg-purple'; 
        case 'Head': return 'bg-warning'; 
        case 'Employee': return 'bg-info'; 
        default: return 'bg-secondary'; 
    } 
}

function getStatusBadgeClass(status) { 
    switch(status) { 
        case 'Approved': return 'status-approved'; 
        case 'Rejected': return 'status-rejected'; 
        case 'Pending': return 'status-pending'; 
        default: return 'bg-secondary'; 
    } 
}

function formatDate(d) { 
    if(!d) return '-'; 
    try { 
        return (d.toDate ? d.toDate() : new Date(d)).toLocaleDateString('en-US'); 
    } catch { 
        return String(d); 
    } 
}

// ==========================================
// EXPORTS
// ==========================================
window.submitLeaveRequest = submitLeaveRequest;
window.submitOvertimeRequest = submitOvertimeRequest;
window.submitTeamLeaderLeaveRequest = submitTeamLeaderLeaveRequest;
window.submitTeamLeaderOvertimeRequest = submitTeamLeaderOvertimeRequest;
window.clearLeaveForm = clearLeaveForm;
window.clearOvertimeForm = clearOvertimeForm;
window.clearTeamLeaderLeaveForm = clearTeamLeaderLeaveForm;
window.clearTeamLeaderOvertimeForm = clearTeamLeaderOvertimeForm;
window.loadMyRequests = loadMyRequests;
window.loadDepartmentRequests = loadDepartmentRequests;
window.loadOperationsRequests = loadOperationsRequests;
window.loadTeamLeaderMyRequests = loadTeamLeaderMyRequests;
window.approveRequest = approveRequest;
window.rejectRequest = rejectRequest;
window.loadAllRequests = loadAllRequests;
window.loadEmployeeList = loadEmployeeList;
window.showAddEmployeeForm = showAddEmployeeForm;
window.editEmployee = editEmployee;
window.deleteEmployee = deleteEmployee;
window.handleEmployeeSubmit = handleEmployeeSubmit;
window.applyFilters = applyFilters;
window.clearFilters = clearFilters;
window.generateExcelReport = generateExcelReport;
window.showExcelModal = showExcelModal;
window.logout = logout;
window.showHelp = showHelp;
window.showCancelModal = showCancelModal;
window.submitCancellation = submitCancellation;
window.approveCancellation = approveCancellation;
window.rejectCancellation = rejectCancellation;
window.changeRequestPage = changeRequestPage;
window.updatePositionOptions = updatePositionOptions;
window.changeMyRequestsPage = changeMyRequestsPage;
window.changeOperationsPage = changeOperationsPage;
window.changeHeadPage = changeHeadPage;
window.changeEmployeePage = changeEmployeePage;
window.toggleSelectAll = toggleSelectAll;
window.deleteSelectedRequests = deleteSelectedRequests;