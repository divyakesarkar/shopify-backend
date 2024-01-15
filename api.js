require('dotenv').config();
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const Shopify = require('shopify-api-node');
const { authorize, redirect, accessTokens } = require('./shopifyOAuthHelper');

const app = express();
const port = process.env.PORT || 4000;

if (!port) {
  console.error('ERROR: Port is not set in .env file');
  process.exit(1);
}

const prisma = new PrismaClient();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Shopify OAuth routes
app.get('/api/shopify/authorize', async (req, res) => {
  return res.redirect(await authorize(req.query.shop));
});

app.get('/api/shopify/redirect', async (req, res) => {
  return res.json(await redirect(req.query.code, req.query.shop));
});

// Route to fetch and save product data
app.post('/api/getProductData', async (req, res) => {
    const shop = req.query.shop;
    console.log('Requested shop:', shop);

    if (!shop || !accessTokens[shop]) {
        return res.status(400).send("Shop not authenticated or token not found.");
    }

    try {
        const shopify = new Shopify({
            shopName: shop,
            accessToken: accessTokens[shop]
        });

        const products = await shopify.product.list();

        // Save each product to the database
        await Promise.all(products.map(async (product) => {
            await prisma.product.upsert({
                where: { shopifyId: product.id.toString() },
                update: {
                    title: product.title,
                    // ... map other product fields
                },
                create: {
                    shopifyId: product.id.toString(),
                    title: product.title,
                    // ... map other product fields
                },
            });
        }));

        res.json(products);
    } catch (error) {
        console.error("Error saving products:", error);
        res.status(500).send(error.message);
    }
});

// Separate route to fetch a specific product
app.get('/api/product/:productId', async (req, res) => {
  const { productId } = req.params;

  try {
    const product = await prisma.product.findUnique({
        where: { shopifyId: productId }
    });

    if (product) {
        res.json(product);
    } else {
        res.status(404).send('Product not found');
    }
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).send(error.message);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
