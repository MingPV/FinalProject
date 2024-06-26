import Card from "../models/cardModel.js";

export const createCard = async (req, res) => {
  try {
    const newCard = new Card(req.body);
    //console.log(req.body)
    await newCard.save();

    res.status(200).json({ message: "OK" });
  } catch (err) {
    if (err.name === "ValidationError") {
      res.status(400).json({ error: "Bad Request na" });
    } else {
      res.status(500).json({ error: "Internal server error." });
    }
  }
};

export const getCards = async (req, res) => {
  res.status(200).send(await Card.find());
};

export const deleteCard = async (req, res) => {

  try {
    // console.log(req.params.id)
    await Card.deleteOne({ _id: req.params.id })
    res.status(200).send(req.params.id);
  } catch (err) {
    res.status(400).json({ error: "Can not delete" })
  }

};

export const updateCard = async (req, res) => {
  console.log("updating", req.body);
  try {
    const id = req.body._id;

    const card = await Card.findById(id);
    if (!card) {
      return res.status(404).json({ error: "Card not found" });
    }

    card.color = req.body.color; // Update any other properties here

    await card.save();

    res.status(200).json({ message: "OK" });
  } catch (err) {
    if (err.name === "ValidationError") {
      res.status(400).json({ error: "Bad Request" });
    } else {
      res.status(500).json({ error: "Internal server error. update card" });
    }
  }
};