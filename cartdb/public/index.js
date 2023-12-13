let iconCart = document.querySelector('.iconCart');
let cart = document.querySelector('.cart');
let container = document.querySelector('.container');
let close = document.querySelector('.close');

iconCart.addEventListener('click', function () {
    if (cart.style.right == '-100%') {
        cart.style.right = '0';
        container.style.transform = 'translateX(-400px)';
    } else {
        cart.style.right = '-100%';
        container.style.transform = 'translateX(0)';
    }
});

close.addEventListener('click', function () {
    cart.style.right = '-100%';
    container.style.transform = 'translateX(0)';
});

let products = null;

document.addEventListener('DOMContentLoaded', function () {
    // Fetch products from the server
    fetch('/api/products')
        .then(response => response.json())
        .then(data => {
            products = data;
            addDataToHTML();
        })
        .catch(error => console.error('Error fetching products:', error));
});

// Show datas product in list
function addDataToHTML() {
    // Remove datas default from HTML
    let listProductHTML = document.querySelector('.listProduct');
    listProductHTML.innerHTML = '';

    // Add new datas
    if (products != null) // If has data
    {
        products.forEach(product => {
            let newProduct = document.createElement('div');
            newProduct.classList.add('item');
            newProduct.innerHTML =
                `<img src="/images/${product.image}" alt="${product.name}">
            <h2>${product.name}</h2>
            <div class="price">$${product.price}</div>
            <button onclick="addCart('${product._id}')">Add To Cart</button>`;

            listProductHTML.appendChild(newProduct);
        });
    }
}

// Use cookie so the cart doesn't get lost on refresh page
let listCart = [];

function checkCart() {
    var cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('listCart='));
    if (cookieValue) {
        listCart = JSON.parse(cookieValue.split('=')[1]);
    } else {
        listCart = [];
    }
}

checkCart();

function addCart(productId) {
    let product = products.find(p => p._id === productId);

    if (product) {
        let productInCart = listCart.find(item => item._id === productId);

        if (!productInCart) {
            productInCart = { ...product, quantity: 1 };
            listCart.push(productInCart);
        } else {
            productInCart.quantity++;
        }

        document.cookie = "listCart=" + JSON.stringify(listCart) + "; expires=Thu, 31 Dec 2025 23:59:59 UTC; path=/;";
        addCartToHTML();
    }
}

function addCartToHTML() {
    // Clear data default
    let listCartHTML = document.querySelector('.listCart');
    listCartHTML.innerHTML = '';

    let totalHTML = document.querySelector('.totalQuantity');
    let totalQuantity = 0;

    // If has product in Cart
    if (listCart) {
        listCart.forEach(product => {
            if (product) {
                let newCart = document.createElement('div');
                newCart.classList.add('item');
                newCart.innerHTML =
                    `<img src="/images/${product.image}" alt="${product.name}">
                    <div class="content">
                        <div class="name">${product.name}</div>
                        <div class="price">$${product.price} / 1 product</div>
                    </div>
                    <div class="quantity">
                        <button onclick="changeQuantity('${product._id}', '-')">-</button>
                        <span class="value">${product.quantity}</span>
                        <button onclick="changeQuantity('${product._id}', '+')">+</button>
                    </div>`;

                listCartHTML.appendChild(newCart);
                totalQuantity = totalQuantity + product.quantity;
            }
        });
    }

    totalHTML.innerText = totalQuantity;
}

function changeQuantity(productId, type) {
    let productInCart = listCart.find(item => item._id === productId);

    if (productInCart) {
        switch (type) {
            case '+':
                productInCart.quantity++;
                break;
            case '-':
                productInCart.quantity--;

                // If quantity <= 0 then remove product in cart
                if (productInCart.quantity <= 0) {
                    listCart = listCart.filter(item => item._id !== productId);
                }
                break;
            default:
                break;
        }

        // Save new data in cookie
        document.cookie = "listCart=" + JSON.stringify(listCart) + "; expires=Thu, 31 Dec 2025 23:59:59 UTC; path=/;";
        // Reload HTML view cart
        addCartToHTML();
    }
}