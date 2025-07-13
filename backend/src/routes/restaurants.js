const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get all restaurants
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, cuisine, priceRange, search } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      isActive: true
    };

    if (cuisine) {
      where.cuisine = cuisine;
    }

    if (priceRange) {
      where.priceRange = priceRange;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { cuisine: { contains: search, mode: 'insensitive' } }
      ];
    }

    const restaurants = await prisma.restaurant.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      include: {
        _count: {
          select: {
            reviews: true
          }
        }
      },
      orderBy: {
        rating: 'desc'
      }
    });

    const total = await prisma.restaurant.count({ where });

    res.json({
      restaurants,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get restaurants error:', error);
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
});

// Get restaurant by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        menuItems: {
          where: { isAvailable: true },
          orderBy: { category: 'asc' }
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            reviews: true
          }
        }
      }
    });

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    res.json({ restaurant });
  } catch (error) {
    console.error('Get restaurant error:', error);
    res.status(500).json({ error: 'Failed to fetch restaurant' });
  }
});

// Create restaurant (admin only)
router.post('/', [
  body('name').trim().isLength({ min: 2 }),
  body('address').trim().notEmpty(),
  body('cuisine').trim().notEmpty(),
  body('priceRange').isIn(['BUDGET', 'MODERATE', 'EXPENSIVE', 'LUXURY'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      description,
      address,
      phone,
      email,
      website,
      cuisine,
      priceRange
    } = req.body;

    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        description,
        address,
        phone,
        email,
        website,
        cuisine,
        priceRange
      }
    });

    res.status(201).json({
      message: 'Restaurant created successfully',
      restaurant
    });
  } catch (error) {
    console.error('Create restaurant error:', error);
    res.status(500).json({ error: 'Failed to create restaurant' });
  }
});

// Update restaurant
router.put('/:id', [
  body('name').trim().isLength({ min: 2 }),
  body('address').trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updateData = req.body;

    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: updateData
    });

    res.json({
      message: 'Restaurant updated successfully',
      restaurant
    });
  } catch (error) {
    console.error('Update restaurant error:', error);
    res.status(500).json({ error: 'Failed to update restaurant' });
  }
});

// Delete restaurant
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.restaurant.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    console.error('Delete restaurant error:', error);
    res.status(500).json({ error: 'Failed to delete restaurant' });
  }
});

// Get restaurant menu
router.get('/:id/menu', async (req, res) => {
  try {
    const { id } = req.params;

    const menuItems = await prisma.menuItem.findMany({
      where: {
        restaurantId: id,
        isAvailable: true
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });

    res.json({ menuItems });
  } catch (error) {
    console.error('Get menu error:', error);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

module.exports = router; 