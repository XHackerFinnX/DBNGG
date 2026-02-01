// Показ/скрытие разделов
function showSection(id) {
    document
        .querySelectorAll(".section")
        .forEach((s) => (s.style.display = "none"));
    document.getElementById(id).style.display = "block";
}

// Фильтр таблиц
function filterTable(tableId, query) {
    const rows = document.querySelectorAll(`#${tableId} tbody tr`);
    rows.forEach((row) => {
        row.style.display = row.innerText
            .toLowerCase()
            .includes(query.toLowerCase())
            ? ""
            : "none";
    });
}

// Модалки
function openModal(id) {
    document.getElementById(id).style.display = "flex";
}
function closeModal(id) {
    document.getElementById(id).style.display = "none";
}

// Админ меню
function toggleAdminMenu() {
    const menu = document.getElementById("adminMenu");
    menu.style.display = menu.style.display === "flex" ? "none" : "flex";
}

// Logout
async function logout() {
    await fetch("/admin/logout", { method: "POST", credentials: "include" });
    window.location.href = "/admin/auth";
}

// Пример функций добавления через API
async function addProduct() {
    const data = {
        article: document.getElementById("productArticle").value,
        name: document.getElementById("productName").value,
        price: parseInt(document.getElementById("productPrice").value),
        count: parseInt(document.getElementById("productCount").value),
        available: document.getElementById("productAvailable").value === "true",
    };
    console.log("Добавляем товар", data);
    closeModal("addProductModal");
}

async function addAdmin() {
    const data = {
        login: document.getElementById("adminLogin").value,
        password: document.getElementById("adminPassword").value,
    };
    console.log("Добавляем админа", data);
    closeModal("addAdminModal");
}

// Проверка авторизации
window.onload = async () => {
    const res = await fetch("/admin/validate-token", {
        credentials: "include",
    });
    if (res.status !== 200) {
        window.location.href = "/admin/auth";
    }
};
