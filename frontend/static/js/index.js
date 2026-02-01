const products = [
    {
        id: 1,
        title: "Футболка DBNGG",
        price: "8 999 руб.",
        status: "Выберите размер",
        weight: "200 г",
        available: true,
        sizes: ["M", "L", "XL", "XXL"],
        images: [
            "/static/image/photo1.jpg",
            "/static/image/photo2.jpg",
            "/static/image/photo3.jpg",
            "/static/image/photo4.jpg",
            "/static/image/photo5.jpg",
            "/static/image/photo6.jpg",
            "/static/image/photo7.jpg",
            "/static/image/photo8.jpg",
            "/static/image/photo9.jpg",
        ],
        parameter: null,
    },
    {
        id: 2,
        title: "Футболка DBNGG",
        price: "8 999 руб.",
        status: "Нет в наличии",
        weight: "200 г",
        available: false,
        sizes: ["M", "L", "XL"],
        images: ["/static/image/photo4.jpg", "/static/image/photo5.jpg"],
        parameter: null,
    },
];

const container = document.getElementById("products");

/* ================== CART ================== */

const cartState = {
    items: [],
    count: 0,
    total: 0,
};

const deliveryState = {
    cityName: "",
    cityFullName: "",
    postalCode: null,
    pvz: null,
    price: null,
    day: null,
};

let cachedPvzList = [];

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cartState.items));
}

function loadCart() {
    const saved = localStorage.getItem("cart");
    if (saved) {
        cartState.items = JSON.parse(saved);
        recalcCart();
        if (cartState.count != 0) {
            showCartWidget();
        }
    }
}

function showPlusOne(card) {
    const el = document.createElement("div");
    el.className = "plus-one";
    el.textContent = "+1";

    card.style.position = "relative";
    card.appendChild(el);

    setTimeout(() => el.remove(), 800);
}

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

function hideCartWidget() {
    const widget = document.getElementById("cartWidget");
    widget.classList.remove("active");
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
    if (!cartState.items.length) {
        closeOrderModal();
        hideCartWidget();
        return;
    }

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

                    <div class="order-price">
                        ${(item.qty * item.price).toLocaleString()} руб.
                    </div>
                </div>

                <button class="remove-item" data-i="${i}">✕</button>
            </div>
        `,
            )
            .join("")}

        ${renderOrderForm()}
    `;

    bindOrderControls();
    bindCityAutocomplete();
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
            renderOrder();
        };
    });

    document.querySelectorAll(".remove-item").forEach((btn) => {
        btn.onclick = () => {
            cartState.items.splice(+btn.dataset.i, 1);
            recalcCart();
            renderOrder();
        };
    });
}

function renderOrderForm() {
    return `
        <form class="order-form" id="orderForm">
            <label>ФИО</label>
            <input type="text" id="fioInput" placeholder="Иванов Иван Иванович">

            <label>Телеграмм</label>
            <input type="text" id="telegramInput" placeholder="@name">

            <label>Номер телефона</label>
            <input type="tel" id="phoneInput" placeholder="+7 (000) 000-00-00">

            <label>Почта</label>
            <input type="email" id="emailInput" placeholder="name@example.com">

            ${renderDelivery()}

            <div style="display: flex; justify-content: flex-end; font-size: 15px; margin-top: 12px;">Сумма: ${cartState.total.toLocaleString()} руб.</div>
            <div class="order-total" id="orderTotalBlock" style="display:none;"></div>

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

    saveCart();

    if (cartState.count === 0) {
        cartState.items = [];
        hideCartWidget();
        closeOrderModal();
    } else {
        showCartWidget();
    }
}

/* ================== Доставка ================== */

function renderDelivery() {
    return `
        <h3>Доставка</h3>

        <label>Город</label>
        <div style="position: relative;">
            <input
                type="text"
                id="deliveryCity"
                value=""
                autocomplete="off"
                name="-"
                placeholder="Введите город"
            >
            <div id="citySuggestions" class="suggestions"></div>
        </div>

        <div id="deliveryOptions" style="margin-top:8px;"></div>

        <label>Пункт получения</label>
        <div id="pvzWrapper" style="position: relative;">
            <input
                type="text"
                id="deliveryPoint"
                placeholder="Выберите пункт получения"
                autocomplete="off"
            >
            <div id="pvzSuggestions" class="suggestions"></div>
        </div>
        <div class="pvz-info"></div>

        <label>Получатель (ФИО полностью)</label>
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

function bindCityAutocomplete() {
    const cityInput = document.getElementById("deliveryCity");
    const suggestions = document.getElementById("citySuggestions");

    if (!cityInput || !suggestions) return;

    // Создаем блок для полного названия города
    let fullNameBlock = cityInput.parentElement.querySelector(".city-fullname");
    if (!fullNameBlock) {
        fullNameBlock = document.createElement("div");
        fullNameBlock.className = "city-fullname";
        fullNameBlock.style.fontSize = "12px";
        fullNameBlock.style.color = "gray";
        fullNameBlock.style.marginTop = "2px";
        fullNameBlock.textContent = "";
        cityInput.parentElement.appendChild(fullNameBlock);
    }

    // Создаем один спиннер
    let spinner = cityInput.parentElement.querySelector(".loading-spinner");
    if (!spinner) {
        spinner = document.createElement("span");
        spinner.className = "loading-spinner";
        spinner.style.position = "absolute";
        spinner.style.right = "10px";
        spinner.style.top = "50%";
        spinner.style.transform = "translateY(-50%)";
        spinner.style.width = "16px";
        spinner.style.height = "16px";
        spinner.style.border = "2px solid #ccc";
        spinner.style.borderTop = "2px solid #22c55e";
        spinner.style.borderRadius = "50%";
        spinner.style.animation = "spin 0.8s linear infinite";
        spinner.style.display = "none";
        cityInput.parentElement.appendChild(spinner);
    }

    let debounceTimer = null;

    cityInput.addEventListener("input", () => {
        const query = cityInput.value.trim();
        suggestions.innerHTML = "";
        suggestions.style.display = "none";
        fullNameBlock.textContent = "";

        if (!query) {
            spinner.style.display = "none";
            return;
        }

        spinner.style.display = "block";

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
            try {
                const res = await fetch(
                    "https://geoserv.tildacdn.com/api/city/",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "text/plain;charset=UTF-8",
                        },
                        body: JSON.stringify({
                            pattern: query,
                            lang: "RU",
                            countries: "ru",
                            rz: "com",
                        }),
                    },
                );

                const data = await res.json();
                spinner.style.display = "none";
                console.log(data);
                if (!data || !data.length) return;

                suggestions.innerHTML = data
                    .map(
                        (city) => `
                        <div class="suggestion-item" data-name="${city.name}" data-fullname="${city.fullName}" data-postalcode="${city.postalCode}" style="padding:8px; cursor:pointer;">
                            <div style="font-size:16px; color:#000;">${city.name}</div>
                            <div style="font-size:12px; color:gray;">${city.fullName}</div>
                        </div>
                    `,
                    )
                    .join("");
                suggestions.style.display = "block";

                suggestions
                    .querySelectorAll(".suggestion-item")
                    .forEach((div) => {
                        div.addEventListener("click", async () => {
                            cityInput.value = div.dataset.name;
                            fullNameBlock.textContent = div.dataset.fullname;
                            deliveryState.cityName = div.dataset.name;
                            deliveryState.cityFullName = div.dataset.fullname;
                            deliveryState.postalCode = div.dataset.postalcode;

                            suggestions.style.display = "none";

                            await loadDeliveryAndPvz();
                        });
                    });
            } catch (err) {
                console.error(err);
                spinner.style.display = "none";
            }
        }, 400);
    });

    // Скрытие списка при клике вне
    document.addEventListener("click", (e) => {
        if (!cityInput.parentElement.contains(e.target)) {
            suggestions.style.display = "none";
        }
    });
}

/* CSS для анимации спиннера */
const style = document.createElement("style");
style.innerHTML = `
@keyframes spin {
    0% { transform: translateY(-50%) rotate(0deg); }
    100% { transform: translateY(-50%) rotate(360deg); }
}
`;
document.head.appendChild(style);

async function loadDeliveryAndPvz() {
    const pointInput = document.getElementById("deliveryPoint");
    const deliveryOptions = document.getElementById("deliveryOptions");
    const pvzWrapper = document.getElementById("pvzWrapper");
    const infoBlock = pvzWrapper.parentElement.querySelector(".pvz-info");
    const cityInputWrapper =
        document.getElementById("deliveryCity").parentElement;

    // ===== СБРОС ПОЛЕЙ =====
    pointInput.value = "";
    pointInput.disabled = true;
    deliveryState.pvz = null;
    deliveryOptions.innerHTML = "";
    pvzWrapper.style.display = "block";
    if (infoBlock) {
        infoBlock.style.display = "none";
        infoBlock.innerHTML = "";
    }

    // ===== СПИННЕР =====
    let spinner = pvzWrapper.querySelector(".loading-spinner");
    if (!spinner) {
        spinner = document.createElement("span");
        spinner.className = "loading-spinner";
        spinner.style.position = "absolute";
        spinner.style.right = "10px";
        spinner.style.top = "50%";
        spinner.style.transform = "translateY(-50%)";
        spinner.style.width = "16px";
        spinner.style.height = "16px";
        spinner.style.border = "2px solid #ccc";
        spinner.style.borderTop = "2px solid #22c55e";
        spinner.style.borderRadius = "50%";
        spinner.style.animation = "spin 0.8s linear infinite";
        pvzWrapper.appendChild(spinner);
    }
    spinner.style.display = "block";

    // ===== Убираем старое сообщение =====
    let noDeliveryMsg = cityInputWrapper.querySelector(".no-delivery-msg");
    if (noDeliveryMsg) noDeliveryMsg.remove();

    try {
        // 1️⃣ расчет доставки
        const calcRes = await fetch("/api/delivery/calculate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postal_code: deliveryState.postalCode }),
        });

        const calcData = await calcRes.json();
        deliveryState.price = calcData.price;
        deliveryState.day = calcData.days;

        // ===== Если доставка невозможна =====
        if (!deliveryState.price || !deliveryState.day) {
            // Показываем сообщение под input города
            noDeliveryMsg = document.createElement("div");
            noDeliveryMsg.className = "no-delivery-msg";
            noDeliveryMsg.style.color = "red";
            noDeliveryMsg.style.fontSize = "13px";
            noDeliveryMsg.style.marginTop = "4px";
            noDeliveryMsg.textContent =
                "К сожалению, в выбранный вами город доставка не осуществляется";
            cityInputWrapper.appendChild(noDeliveryMsg);

            // Скрываем все блоки доставки
            deliveryOptions.style.display = "none";
            pvzWrapper.style.display = "none";
            if (infoBlock) infoBlock.style.display = "none";
            document.getElementById("deliveryRecipient").style.display = "none";
            document.getElementById("deliveryComment").style.display = "none";

            spinner.style.display = "none";
            return;
        }

        // ===== Доставка возможна, показываем все блоки =====
        deliveryOptions.style.display = "block";
        pvzWrapper.style.display = "block";
        document.getElementById("deliveryRecipient").style.display = "block";
        document.getElementById("deliveryComment").style.display = "block";

        // ===== Радиокнопки =====
        let html = `
            <label style="display:flex; gap:8px;">
                <input type="radio" name="deliveryType" value="pvz" checked style="width:16px;">
                Доставка в ПВЗ СДЭК от ${deliveryState.day} дней, ${deliveryState.price} руб.
            </label>
        `;

        console.log(deliveryState.cityFullName);
        if (deliveryState.cityFullName.toLowerCase() === "россия, г москва") {
            html += `
                <label style="display:flex; gap:8px;">
                    <input type="radio" name="deliveryType" value="self" style="width:16px;">
                    Самовывоз от 10 дней
                </label>
            `;
        }

        deliveryOptions.innerHTML = html;

        // ===== ОБРАБОТЧИК ПЕРЕКЛЮЧЕНИЯ ТИПА ДОСТАВКИ =====
        bindDeliveryTypeRadios();

        // 2️⃣ загрузка ПВЗ
        const pvzRes = await fetch(
            `/api/delivery/pvz?postalCode=${deliveryState.postalCode}`,
        );
        const pvzList = await pvzRes.json();
        cachedPvzList = pvzList;

        renderPvzAutocomplete(cachedPvzList);

        pointInput.disabled = false;
        spinner.style.display = "none";
    } catch (e) {
        console.error("Ошибка доставки", e);
        spinner.style.display = "none";
        pointInput.disabled = true;
    }
}

function renderPvzAutocomplete(pvzList) {
    const wrapper = document.getElementById("pvzWrapper");
    const input = document.getElementById("deliveryPoint");
    const suggestions = document.getElementById("pvzSuggestions");
    const infoBlock = wrapper.parentElement.querySelector(".pvz-info");

    // ===== СБРОС =====
    infoBlock.style.display = "none";
    infoBlock.innerHTML = "";
    input.value = "";
    wrapper.style.display = "block";

    // ===== ОБРАБОТЧИКИ =====
    input.onclick = () => {
        if (!pvzList.length) return;
        buildPvzList(pvzList);
        suggestions.style.display = "block";
    };

    input.oninput = () => buildPvzList(pvzList, input.value);

    function buildPvzList(list, query = "") {
        const q = query.toLowerCase();
        const filtered = list.filter(
            (p) =>
                p.name.toLowerCase().includes(q) ||
                p.address.toLowerCase().includes(q),
        );

        if (!filtered.length) {
            suggestions.style.display = "none";
            return;
        }

        suggestions.innerHTML = filtered
            .map(
                (p) => `
                <div class="suggestion-item" data-code="${p.code}" style="padding:8px; cursor:pointer;">
                    <div style="font-size:15px;">${p.name}</div>
                    <div style="font-size:12px; color:gray;">${p.address}</div>
                </div>
            `,
            )
            .join("");
        suggestions.style.display = "block";

        suggestions.querySelectorAll(".suggestion-item").forEach((el) => {
            el.onclick = () => selectPvz(el.dataset.code);
        });
    }

    function selectPvz(code) {
        const pvz = pvzList.find((p) => p.code === code);
        if (!pvz) return;

        deliveryState.pvz = pvz.code;

        wrapper.style.display = "none";
        suggestions.style.display = "none";

        infoBlock.innerHTML = `
            <div style="font-size:14px;">${pvz.name}</div>
            <div style="font-size:14px;">Адрес: ${pvz.address}</div>
            ${pvz.addressComment ? `<div style="font-size:13px; color:gray;">${pvz.addressComment}</div>` : ""}
            <div style="font-size:14px;">Время работы: ${pvz.workTime}</div>
            ${pvz.phone ? `<div style="font-size:14px;">Телефон: ${pvz.phone}</div>` : ""}
            <div class="pvz-change" style="margin-top:4px; cursor:pointer; text-decoration:underline; text-decoration-style:dashed; font-size:14px;">Изменить</div>
        `;
        infoBlock.style.display = "block";

        infoBlock.querySelector(".pvz-change").onclick = resetPvz;

        updateOrderTotal();
    }

    function resetPvz() {
        const wrapper = document.getElementById("pvzWrapper");
        const infoBlock = wrapper.parentElement.querySelector(".pvz-info");

        deliveryState.pvz = null;

        wrapper.style.display = "block";
        infoBlock.style.display = "none";
        infoBlock.innerHTML = "";
        document.getElementById("deliveryPoint").value = "";

        updateOrderTotal();
    }

    document.addEventListener("click", (e) => {
        if (!wrapper.contains(e.target)) {
            suggestions.style.display = "none";
        }
    });
}

function updateOrderTotal() {
    const orderTotalBlock = document.getElementById("orderTotalBlock");
    if (!orderTotalBlock) return;

    const typeRadio = document.querySelector(
        'input[name="deliveryType"]:checked',
    );
    const type = typeRadio ? typeRadio.value : "pvz";

    // Решаем, показывать сумму
    let showTotal = false;
    if (type === "self") {
        showTotal = true;
    } else if (type === "pvz" && deliveryState.pvz) {
        showTotal = true;
    }

    if (!showTotal) {
        orderTotalBlock.style.display = "none";
        orderTotalBlock.innerHTML = "";
        return;
    }

    const deliveryPrice = type === "self" ? 0 : deliveryState.price || 0;
    const productsTotal = cartState.total || 0;
    const totalSum = productsTotal + deliveryPrice;

    orderTotalBlock.innerHTML = `
        <div>Доставка в ПВЗ СДЭК: <b>${deliveryPrice.toLocaleString()} руб.</b></div>
        <div>Итоговая сумма: <b>${totalSum.toLocaleString()} руб.</b></div>
    `;
    orderTotalBlock.style.display = "block";
}

// ===== ОБРАБОТЧИК ПЕРЕКЛЮЧЕНИЯ ТИПА ДОСТАВКИ =====
function bindDeliveryTypeRadios() {
    const deliveryOptions = document.getElementById("deliveryOptions");
    if (!deliveryOptions) return;

    deliveryOptions
        .querySelectorAll('input[name="deliveryType"]')
        .forEach((radio) => {
            radio.addEventListener("change", async () => {
                const type = radio.value;
                const pvzWrapper = document.getElementById("pvzWrapper");
                const infoBlock =
                    pvzWrapper.parentElement.querySelector(".pvz-info");

                if (type === "self") {
                    // Самовывоз
                    deliveryState.price = 0;
                    deliveryState.pvz = null;

                    // Скрываем выбор ПВЗ
                    pvzWrapper.style.display = "none";
                    infoBlock.style.display = "none";
                } else {
                    // Доставка СДЭК
                    pvzWrapper.style.display = "block";
                    // Цена должна быть пересчитана с сервера или оставлена
                    const calcRes = await fetch("/api/delivery/calculate", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            postal_code: deliveryState.postalCode,
                        }),
                    });
                    const calcData = await calcRes.json();
                    deliveryState.price = calcData.price || 0;
                }

                // Обновляем итоговую сумму
                updateOrderTotal();
            });
        });
}

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
            product.price.replace(/\s/g, "").replace("руб.", ""),
        );

        const existingItem = cartState.items.find(
            (item) =>
                item.product.id === product.id && item.size === selectedSize,
        );

        if (existingItem) {
            existingItem.qty += 1;
        } else {
            cartState.items.push({
                product,
                size: selectedSize,
                qty: 1,
                price,
            });
        }

        recalcCart();
        showCartWidget();
        showPlusOne(document.querySelector(".product-card"));
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

    const fields = [
        {
            el: document.getElementById("fioInput"),
            name: "ФИО",
            check: (v) => v.trim().length >= 5,
        },
        {
            el: document.getElementById("phoneInput"),
            name: "Номер телефона",
            check: (v) => /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/.test(v),
        },
        {
            el: document.getElementById("emailInput"),
            name: "Почта",
            check: (v) =>
                /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(v),
        },
        {
            el: document.getElementById("deliveryCity"),
            name: "Город",
            check: (v) => v.trim().length >= 2,
        },
        {
            el: document.getElementById("deliveryPoint"),
            name: "Пункт получения",
            check: () => {
                const typeRadio = document.querySelector(
                    'input[name="deliveryType"]:checked',
                );
                const type = typeRadio ? typeRadio.value : "pvz";
                if (type === "self") return true; // Самовывоз → необязательно
                return !!deliveryState.pvz; // СДЭК → обязательно
            },
        },
        {
            el: document.getElementById("deliveryRecipient"),
            name: "Получатель",
            check: (v) => v.trim().length >= 5,
        },
    ];

    let valid = true;

    // Очистка старых ошибок
    document
        .querySelectorAll(".input-error")
        .forEach((el) => el.classList.remove("input-error"));

    fields.forEach(({ el, check }) => {
        if (!el || !check(el.value)) {
            el.classList.add("input-error");
            valid = false;
        }
    });

    if (!valid) {
        return;
    }

    // ✅ Всё валидно
    alert("Заказ отправлен ✔");

    // Сбор всех данных формы
    const orderData = {
        fio: document.getElementById("fioInput")?.value || "",
        telegram: document.getElementById("telegramInput")?.value || "",
        phone: document.getElementById("phoneInput")?.value || "",
        email: document.getElementById("emailInput")?.value || "",
        delivery: {
            city: deliveryState.cityName,
            fullName: deliveryState.cityFullName,
            point: document.getElementById("deliveryPoint")?.value || "",
            pvz: deliveryState.pvz,
            price: deliveryState.price,
            comment: document.querySelector("textarea")?.value || "",
        },

        cart: JSON.parse(localStorage.getItem("cart")) || [],
    };

    // Красивый вывод в консоль
    console.group("🛒 Данные заказа");
    console.log("👤 ФИО:", orderData.fio);
    console.log("👤 Телеграмм:", orderData.telegram);
    console.log("📞 Телефон:", orderData.phone);
    console.log("📧 Email:", orderData.email);

    console.group("🚚 Доставка");
    console.log("Город:", orderData.delivery.city);
    console.log("Пункт получения:", orderData.delivery.point);
    console.log("Получатель:", orderData.delivery.recipient);
    console.log("Комментарий:", orderData.delivery.comment);
    console.groupEnd();

    console.group("📦 Корзина");
    console.table(orderData.cart);
    console.groupEnd();

    console.groupEnd();

    // Тут дальше: отправка на backend / Telegram / API
});

loadCart();
