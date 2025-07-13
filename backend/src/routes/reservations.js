const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const router = express.Router();
const prisma = new PrismaClient();

// Get user's reservations
router.get('/my-reservations', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const reservations = await prisma.reservation.findMany({
      where: { userId },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    res.json({ reservations });
  } catch (error) {
    console.error('Get reservations error:', error);
    res.status(500).json({ error: 'Failed to fetch reservations' });
  }
});

// Create reservation
router.post('/', [
  body('date').isISO8601(),
  body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('partySize').isInt({ min: 1, max: 20 }),
  body('restaurantId').notEmpty(),
  body('specialRequests').optional().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const {
      date,
      time,
      partySize,
      restaurantId,
      specialRequests
    } = req.body;

    // Check if restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId }
    });

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Check if date is in the future
    const reservationDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (reservationDate < today) {
      return res.status(400).json({ error: 'Reservation date must be in the future' });
    }

    const reservation = await prisma.reservation.create({
      data: {
        date: reservationDate,
        time,
        partySize,
        specialRequests,
        userId,
        restaurantId
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Reservation created successfully',
      reservation
    });
  } catch (error) {
    console.error('Create reservation error:', error);
    res.status(500).json({ error: 'Failed to create reservation' });
  }
});

// Update reservation
router.put('/:id', [
  body('date').optional().isISO8601(),
  body('time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('partySize').optional().isInt({ min: 1, max: 20 }),
  body('specialRequests').optional().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    const { id } = req.params;

    // Check if reservation belongs to user
    const existingReservation = await prisma.reservation.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!existingReservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const updateData = req.body;
    if (updateData.date) {
      const reservationDate = new Date(updateData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (reservationDate < today) {
        return res.status(400).json({ error: 'Reservation date must be in the future' });
      }
      updateData.date = reservationDate;
    }

    const reservation = await prisma.reservation.update({
      where: { id },
      data: updateData,
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true
          }
        }
      }
    });

    res.json({
      message: 'Reservation updated successfully',
      reservation
    });
  } catch (error) {
    console.error('Update reservation error:', error);
    res.status(500).json({ error: 'Failed to update reservation' });
  }
});

// Cancel reservation
router.delete('/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    const { id } = req.params;

    // Check if reservation belongs to user
    const reservation = await prisma.reservation.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    await prisma.reservation.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });

    res.json({ message: 'Reservation cancelled successfully' });
  } catch (error) {
    console.error('Cancel reservation error:', error);
    res.status(500).json({ error: 'Failed to cancel reservation' });
  }
});

// Get reservation by ID
router.get('/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    const { id } = req.params;

    const reservation = await prisma.reservation.findFirst({
      where: {
        id,
        userId
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true
          }
        }
      }
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    res.json({ reservation });
  } catch (error) {
    console.error('Get reservation error:', error);
    res.status(500).json({ error: 'Failed to fetch reservation' });
  }
});

module.exports = router; 