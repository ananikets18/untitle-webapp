const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Create a new quote
router.post("/", async (req, res) => {
  const { content, author = null, tags = [], userId = null } = req.body;

  if (!content || content.trim() === "") {
    return res.status(400).json({ error: "Quote content is required." });
  }

  try {
    const newQuote = await prisma.quote.create({
      data: {
        content,
        author,
        tags,
        userId, // Optional: null for anonymous quotes
      }
    });

    res.status(201).json({
      message: "Quote created successfully",
      quote: newQuote
    });
  } catch (error) {
    console.error("Error creating quote:", error);
    res.status(500).json({ error: "Failed to create quote" });
  }
});


// Get all quotes
// Get all quotes or filter by tag
router.get("/", async (req, res) => {
  const { tag } = req.query;

  try {
    let quotes;

    if (tag) {
      quotes = await prisma.quote.findMany({
        where: {
          tags: {
            has: tag // Prisma's 'has' operator for JSON arrays
          }
        },
        orderBy: { createdAt: "desc" }
      });
    } else {
      quotes = await prisma.quote.findMany({
        orderBy: { createdAt: "desc" }
      });
    }

    res.json(quotes);
  } catch (error) {
    console.error("Error fetching quotes:", error);
    res.status(500).json({ error: "Failed to fetch quotes" });
  }
});


// Get a single quote by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const quote = await prisma.quote.findUnique({
      where: { id: parseInt(id) }
    });

    if (!quote) {
      return res.status(404).json({ error: "Quote not found" });
    }

    res.json(quote);
  } catch (error) {
    console.error("Error fetching quote:", error);
    res.status(500).json({ error: "Failed to fetch quote" });
  }
});




// Update a quote by ID
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { content, author = null, tags = [], userId } = req.body;

  try {
    const quote = await prisma.quote.findUnique({ where: { id: parseInt(id) } });

    if (!quote) {
      return res.status(404).json({ error: "Quote not found" });
    }

    // Check if the logged-in user is the owner of the quote
    if (quote.userId !== userId) {
      return res.status(403).json({ error: "You can only update your own quotes." });
    }

    const updated = await prisma.quote.update({
      where: { id: parseInt(id) },
      data: { content, author, tags, userId }
    });

    res.json({
      message: "Quote updated successfully",
      quote: updated
    });
  } catch (error) {
    console.error("Error updating quote:", error);
    res.status(500).json({ error: "Failed to update quote" });
  }
});


// Delete a quote by ID
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.quote.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: "Quote deleted successfully" });
  } catch (error) {
    console.error("Error deleting quote:", error);
    res.status(500).json({ error: "Failed to delete quote" });
  }
});

module.exports = router;
