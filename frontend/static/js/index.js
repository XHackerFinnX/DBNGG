const products = [
    {
        title: "Футболка DBNGG",
        price: "8 999 руб.",
        status: "Нет в наличии",
        weight: "200 г",
        available: true,
        sizes: ["M", "L", "XL", "XXL"],
        images: [
            "/frontend/static/image/photo1.jpg",
            "/frontend/static/image/photo2.jpg",
            "/frontend/static/image/photo3.jpg",
            "/frontend/static/image/photo4.jpg",
            "/frontend/static/image/photo5.jpg",
            "/frontend/static/image/photo6.jpg",
            "/frontend/static/image/photo7.jpg",
            "/frontend/static/image/photo8.jpg",
            "/frontend/static/image/photo9.jpg",
        ],
    },
    {
        title: "Футболка DBNGG",
        price: "8 999 руб.",
        status: "Нет в наличии",
        weight: "200 г",
        available: false,
        sizes: ["M", "L", "XL"],
        images: [
            "/frontend/static/image/photo4.jpg",
            "/frontend/static/image/photo5.jpg",
        ],
    },
];

const container = document.getElementById("products");

/* ================== CART ================== */

const cartState = {
    items: [],
    count: 0,
    total: 0,
};

function getProductWord(count) {
    if (count % 10 === 1 && count % 100 !== 11) return "товар";
    if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100))
        return "товара";
    return "товаров";
}

function showCartWidget() {
    const widget = document.getElementById("cartWidget");

    document.getElementById("cartTotalPrice").textContent =
        `${cartState.total.toLocaleString()} ₽`;

    document.getElementById("cartTotalCount").textContent =
        `${cartState.count} ${getProductWord(cartState.count)}`;

    widget.classList.add("active");
}

const orderModal = document.getElementById("orderModal");
const orderModalBody = document.getElementById("orderModalBody");
const orderModalClose = document.getElementById("orderModalClose");

document.getElementById("cartWidget").addEventListener("click", () => {
    openOrderModal();
});

function openOrderModal() {
    document.body.classList.add("modal-open");
    orderModal.classList.add("show");

    renderOrder();
}

function closeOrderModal() {
    document.body.classList.remove("modal-open");
    orderModal.classList.remove("show");
}

orderModalClose.addEventListener("click", closeOrderModal);

orderModal.addEventListener("click", (e) => {
    if (e.target === orderModal) closeOrderModal();
});

function renderOrder() {
    if (!cartState.items.length) return;

    orderModalBody.innerHTML = `
        <h2>Ваш заказ:</h2>

        ${cartState.items
            .map(
                (item, i) => `
            <div class="order-item">
                <img src="${item.product.images[0]}" class="order-img">

                <div class="order-info">
                    <div class="order-title">${item.product.title}</div>
                    <div class="order-size">Размер: ${item.size}</div>
                </div>

                <div class="order-controls">
                    <button class="qty-btn" data-i="${i}" data-type="minus">−</button>
                    <span>${item.qty}</span>
                    <button class="qty-btn" data-i="${i}" data-type="plus">+</button>
                </div>

                <div class="order-price">
                    ${(item.qty * item.price).toLocaleString()} руб.
                </div>

                <button class="remove-item" data-i="${i}">X</button>
            </div>
        `
            )
            .join("")}

        ${renderOrderForm()}
    `;

    bindOrderControls();
}

function bindOrderControls() {
    document.querySelectorAll(".qty-btn").forEach((btn) => {
        btn.onclick = () => {
            const i = +btn.dataset.i;
            const type = btn.dataset.type;

            if (type === "plus") cartState.items[i].qty++;
            if (type === "minus") cartState.items[i].qty--;

            if (cartState.items[i].qty <= 0) {
                cartState.items.splice(i, 1);
            }

            recalcCart();
            showCartWidget();
            renderOrder();
        };
    });

    document.querySelectorAll(".remove-item").forEach((btn) => {
        btn.onclick = () => {
            cartState.items.splice(+btn.dataset.i, 1);
            recalcCart();
            showCartWidget();
            renderOrder();
        };
    });
}

function renderOrderForm() {
    return `
        <form class="order-form" id="orderForm">
            <label>ФИО</label>
            <input type="text">

            <label>Телеграмм</label>
            <input type="text" placeholder="@Name">

            <label>Номер телефона</label>
            <input type="tel" id="phoneInput" placeholder="+7 (000) 000-00-00">

            <label>Почта</label>
            <input type="email" id="emailInput">

            ${renderDelivery()}

            <div class="order-total">
                Сумма: <b>${cartState.total.toLocaleString()} руб.</b>
            </div>

            <button type="submit" class="order-submit">
                Оформить заказ
            </button>
        </form>
    `;
}

function recalcCart() {
    cartState.count = 0;
    cartState.total = 0;

    cartState.items.forEach((item) => {
        cartState.count += item.qty;
        cartState.total += item.qty * item.price;
    });

    if (cartState.count === 0) {
        closeOrderModal();
        document.getElementById("cartWidget").classList.remove("active");
    }
}

function renderDelivery() {
    return `
        <h3>Доставка</h3>

        <label>Город</label>
        <input
            type="text"
            id="deliveryCity"
            value="Санкт-Петербург"
        >

        <label>Пункт получения</label>
        <input
            type="text"
            id="deliveryPoint"
            placeholder="Выберите пункт получения"
        >

        <label>Получатель</label>
        <input
            type="text"
            id="deliveryRecipient"
            placeholder="Иванов Иван Иванович"
        >

        <label>Комментарий</label>
        <textarea
            id="deliveryComment"
            placeholder="Комментарий к заказу"
        ></textarea>
    `;
}

function getDeliveryData() {
    return {
        city: document.getElementById("deliveryCity")?.value || "",
        point: document.getElementById("deliveryPoint")?.value || "",
        recipient: document.getElementById("deliveryRecipient")?.value || "",
        comment: document.getElementById("deliveryComment")?.value || "",
    };
}

const delivery = getDeliveryData();

/* ================== GRID ================== */

products.forEach((p) => {
    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
        <img src="${p.images[0]}" class="product-img">
        <div class="product-title">${p.title}</div>
        <div class="price">${p.price}</div>
        ${!p.available ? `<div class="out">${p.status}</div>` : ""}
    `;

    const img = card.querySelector(".product-img");

    if (p.images.length > 1) {
        card.addEventListener("mouseenter", () => (img.src = p.images[1]));
        card.addEventListener("mouseleave", () => (img.src = p.images[0]));
    }

    card.addEventListener("click", () => openModal(p));
    container.appendChild(card);
});

/* ================== MODAL ================== */

const modalMainImg = document.getElementById("modal-main-img");
const modalThumbs = document.getElementById("modal-thumbs");

let currentImages = [];
let currentIndex = 0;
let selectedSize = null;
let currentProduct = null;

function openModal(product) {
    currentProduct = product;
    selectedSize = null;

    setTimeout(() => {
        modal.classList.add("show");
        document.body.classList.add("modal-open");
    }, 10);

    document.getElementById("modal-title").textContent = product.title;
    document.getElementById("modal-price").textContent = product.price;
    document.getElementById("modal-weight").textContent =
        "Вес товара: " + product.weight;

    currentImages = product.images;
    currentIndex = 0;
    modalThumbs.innerHTML = "";

    product.images.forEach((img, index) => {
        const thumb = document.createElement("img");
        thumb.src = img;
        thumb.onclick = () => {
            currentIndex = index;
            updateMainImage();
        };
        modalThumbs.appendChild(thumb);
    });

    updateMainImage();

    const sizeSelector = document.getElementById("size-selector");
    sizeSelector.innerHTML = "";

    product.sizes.forEach((size) => {
        const btn = document.createElement("button");
        btn.className = "size-btn";
        btn.textContent = size;

        btn.onclick = () => {
            document
                .querySelectorAll(".size-btn")
                .forEach((b) => b.classList.remove("active"));

            btn.classList.add("active");
            selectedSize = size;

            if (product.available) {
                buyBtn.disabled = false;
                buyBtn.textContent = "Купить";
            }
        };
        sizeSelector.appendChild(btn);
    });

    const buyBtn = document.getElementById("modal-buy");

    if (product.available) {
        buyBtn.textContent = "Выберите размер";
        buyBtn.disabled = true;
    } else {
        buyBtn.textContent = "Нет в наличии";
        buyBtn.disabled = true;
    }

    buyBtn.onclick = () => {
        if (!selectedSize || !product.available) return;

        const price = parseInt(
            product.price.replace(/\s/g, "").replace("руб.", "")
        );

        cartState.items.push({
            product,
            size: selectedSize,
            qty: 1,
            price,
        });

        recalcCart();
        showCartWidget();
        closeModal();
    };
}

function closeModal() {
    modal.classList.remove("show");
    document.body.classList.remove("modal-open");
}

/* ================== GALLERY ================== */

function updateMainImage() {
    modalMainImg.src = currentImages[currentIndex];

    document.querySelectorAll(".modal-thumbs img").forEach((img, i) => {
        img.classList.toggle("active", i === currentIndex);
    });
}

document.getElementById("gallery-prev").onclick = () => {
    currentIndex =
        (currentIndex - 1 + currentImages.length) % currentImages.length;
    updateMainImage();
};

document.getElementById("gallery-next").onclick = () => {
    currentIndex = (currentIndex + 1) % currentImages.length;
    updateMainImage();
};

/* ================== SWIPE ================== */

let startX = 0;

modalMainImg.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
});

modalMainImg.addEventListener("touchend", (e) => {
    const diff = e.changedTouches[0].clientX - startX;
    if (Math.abs(diff) > 50) {
        diff > 0
            ? document.getElementById("gallery-prev").click()
            : document.getElementById("gallery-next").click();
    }
});

/* ================== FULLSCREEN ================== */

const fullscreen = document.getElementById("imageFullscreen");
const fullscreenImg = document.getElementById("fullscreenImg");
const fullscreenClose = document.getElementById("fullscreenClose");

modalMainImg.onclick = () => {
    fullscreenImg.src = modalMainImg.src;
    fullscreen.classList.add("show");
};

fullscreenClose.onclick = () => fullscreen.classList.remove("show");

fullscreen.onclick = (e) => {
    if (e.target === fullscreen) fullscreen.classList.remove("show");
};

/* ================== ACCORDION ================== */

document.querySelectorAll(".acc-item").forEach((item) => {
    item.onclick = () => item.parentElement.classList.toggle("active");
});

/* ================== COPY ================== */

document.querySelectorAll(".contact-line").forEach((el) => {
    el.onclick = () => {
        navigator.clipboard.writeText(el.dataset.copy);
        el.style.color = "#22c55e";
        setTimeout(() => (el.style.color = "#fff"), 800);
    };
});

/* ================== Валидация телефона и email ================== */

document.addEventListener("input", (e) => {
    if (e.target.id !== "phoneInput") return;

    let digits = e.target.value.replace(/\D/g, "");
    if (digits.startsWith("7")) digits = digits.slice(1);
    digits = digits.slice(0, 10);

    let result = "+7";
    if (digits.length > 0) result += " (" + digits.slice(0, 3);
    if (digits.length >= 4) result += ") " + digits.slice(3, 6);
    if (digits.length >= 7) result += "-" + digits.slice(6, 8);
    if (digits.length >= 9) result += "-" + digits.slice(8, 10);

    e.target.value = result;
});

document.addEventListener("submit", (e) => {
    if (e.target.id !== "orderForm") return;
    e.preventDefault();

    const phone = document.getElementById("phoneInput");
    const email = document.getElementById("emailInput");

    let valid = true;

    if (!/^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/.test(phone.value)) {
        phone.style.borderColor = "red";
        valid = false;
    } else phone.style.borderColor = "#000";

    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email.value)) {
        email.style.borderColor = "red";
        valid = false;
    } else email.style.borderColor = "#000";

    if (!valid) return;

    alert("Заказ отправлен ✔");
});
