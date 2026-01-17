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

let currentImages = [];
let currentIndex = 0;

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
        card.addEventListener("mouseenter", () => {
            img.src = p.images[1];
        });

        card.addEventListener("mouseleave", () => {
            img.src = p.images[0];
        });
    }

    card.addEventListener("click", () => {
        openModal(p);
    });

    container.appendChild(card);
});

const modal = document.getElementById("modal");
const modalMainImg = document.getElementById("modal-main-img");
const modalThumbs = document.getElementById("modal-thumbs");

function openModal(product) {
    const modalOverlay = document.getElementById("modal");

    // ✅ ОДИН раз добавляем классы с небольшой задержкой для CSS анимации
    setTimeout(() => {
        modalOverlay.classList.add("show");
        document.body.classList.add("modal-open");
    }, 10);

    // Заполняем контент
    document.getElementById("modal-title").textContent = product.title;
    document.getElementById("modal-price").textContent = product.price;
    document.getElementById("modal-weight").textContent =
        "Вес товара: " + product.weight;

    modalMainImg.src = product.images[0];
    modalThumbs.innerHTML = "";

    product.images.forEach((img, index) => {
        const thumb = document.createElement("img");
        thumb.src = img;

        thumb.addEventListener("click", () => {
            currentIndex = index;
            updateMainImage();
        });

        modalThumbs.appendChild(thumb);
    });

    currentImages = product.images;
    currentIndex = 0;
    updateMainImage();

    // Создаем кнопки размеров
    const sizeSelector = document.getElementById("size-selector");
    sizeSelector.innerHTML = "";

    product.sizes.forEach((size, index) => {
        const sizeBtn = document.createElement("button");
        sizeBtn.className = "size-btn";
        sizeBtn.textContent = size;
        sizeBtn.style.animationDelay = `${index * 0.05}s`;

        sizeBtn.addEventListener("click", () => {
            document.querySelectorAll(".size-btn").forEach((btn) => {
                btn.classList.remove("active");
            });
            sizeBtn.classList.add("active");

            const buyBtn = document.getElementById("modal-buy");
            if (product.available) {
                buyBtn.disabled = false;
                buyBtn.textContent = "Купить";
                buyBtn.style.background = "#22c55e";
                buyBtn.style.color = "#000";
            }
        });

        sizeSelector.appendChild(sizeBtn);
    });

    // Настраиваем кнопку Купить
    const buyBtn = document.getElementById("modal-buy");
    if (product.available) {
        buyBtn.textContent = "Выберите размер";
        buyBtn.disabled = true;
        buyBtn.style.background = "#555";
        buyBtn.style.color = "#aaa";
    } else {
        buyBtn.textContent = "Нет в наличии";
        buyBtn.disabled = true;
    }
}

function closeModal() {
    const modalOverlay = document.getElementById("modal");

    // ✅ ОДИН раз убираем классы
    modalOverlay.classList.remove("show");
    document.body.classList.remove("modal-open");

    // ✅ Ждем окончания анимации перед полным скрытием
    setTimeout(() => {
        // Дополнительная очистка (если нужно)
    }, 400);
}

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

let startX = 0;

modalMainImg.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
});

modalMainImg.addEventListener("touchend", (e) => {
    const diff = e.changedTouches[0].clientX - startX;

    if (Math.abs(diff) > 50) {
        if (diff > 0) {
            document.getElementById("gallery-prev").click();
        } else {
            document.getElementById("gallery-next").click();
        }
    }
});

const fullscreen = document.getElementById("imageFullscreen");
const fullscreenImg = document.getElementById("fullscreenImg");
const fullscreenClose = document.getElementById("fullscreenClose");

modalMainImg.addEventListener("click", () => {
    fullscreenImg.src = modalMainImg.src;
    fullscreen.classList.add("show");
});

fullscreenClose.addEventListener("click", () => {
    fullscreen.classList.remove("show");
});

fullscreen.addEventListener("click", (e) => {
    if (e.target === fullscreen) {
        fullscreen.classList.remove("show");
    }
});

// Аккордеон
document.querySelectorAll(".acc-item").forEach((item) => {
    item.addEventListener("click", () => {
        item.parentElement.classList.toggle("active");
    });
});

// Копирование контактов
document.querySelectorAll(".contact-line").forEach((el) => {
    el.addEventListener("click", () => {
        navigator.clipboard.writeText(el.dataset.copy);
        el.style.color = "#22c55e";
        setTimeout(() => (el.style.color = "#fff"), 800);
    });
});
