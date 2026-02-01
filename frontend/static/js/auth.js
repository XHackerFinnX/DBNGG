const eyeSvg = `
<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" class="eye-icon">
    <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/>
    <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/>
</svg>
`;

const eyeSlashSvg = `
<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" class="eye-icon">
    <path d="m10.79 12.912-1.614-1.615a3.5 3.5 0 0 1-4.474-4.474l-2.06-2.06C.938 6.278 0 8 0 8s3 5.5 8 5.5a7.029 7.029 0 0 0 2.79-.588z"/>
    <path d="M5.21 3.088A7.028 7.028 0 0 1 8 2.5c5 0 8 5.5 8 5.5s-.939 1.721-2.641 3.238l-2.062-2.062a3.5 3.5 0 0 0-4.474-4.474L5.21 3.089z"/>
    <path d="M5.525 7.646a2.5 2.5 0 0 0 2.829 2.829l-2.83-2.829zm4.95.708-2.829-2.83a2.5 2.5 0 0 1 2.829 2.829zm3.171 6-12-12 .708-.708 12 12-.708.708z"/>
</svg>
`;

// вставляем глазик по умолчанию
document.getElementById("togglePassword").innerHTML = eyeSvg;

function togglePassword() {
    const passwordInput = document.getElementById("password");
    const toggle = document.getElementById("togglePassword");

    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        toggle.innerHTML = eyeSlashSvg;
    } else {
        passwordInput.type = "password";
        toggle.innerHTML = eyeSvg;
    }
}

async function getIp() {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    return data.ip;
}

async function login() {
    const loginValue = document.getElementById("login").value;
    const passwordValue = document.getElementById("password").value;
    const errorEl = document.getElementById("error");
    const btn = document.getElementById("loginBtn");

    if (!loginValue || !passwordValue) {
        errorEl.textContent = "Введите логин и пароль";
        return;
    }

    errorEl.textContent = "";
    const oldText = btn.textContent;
    btn.innerHTML = '<div class="spinner"></div>'; // спиннер
    btn.disabled = true;

    try {
        const ip = await getIp();

        const res = await fetch("/admin/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include", // для cookie
            body: JSON.stringify({
                login: loginValue,
                password: passwordValue,
                ip,
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            errorEl.textContent = data.detail || "Ошибка входа";
            btn.textContent = oldText;
            btn.disabled = false;
            return;
        }

        // успешный вход — редирект на панель
        window.location.href = "/admin/panel";
    } catch (e) {
        console.error(e);
        errorEl.textContent = "Ошибка соединения";
        btn.textContent = oldText;
        btn.disabled = false;
    }
}

async function register() {
    const loginValue = document.getElementById("login").value;
    const passwordValue = document.getElementById("password").value;
    const errorEl = document.getElementById("error");

    errorEl.textContent = "";

    try {
        const res = await fetch("/admin/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                login: loginValue,
                password: passwordValue,
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            errorEl.textContent = data.detail || "Ошибка регистрации";
            return;
        }

        alert("Администратор создан");
    } catch (e) {
        console.error(e);
        errorEl.textContent = "Ошибка соединения";
    }
}
