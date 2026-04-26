import express from "express";
import {
  getTracker,
  addVisitedCountries,
  getTraveler,
  addNewTraveler,
  clearVisitedCountries,
} from "../controller/containedController.js";

const router = express.Router();

router.get("/", getTracker);

router.post("/add", addVisitedCountries);

router.post("/user", getTraveler);

router.post("/new", addNewTraveler);

router.post("/clear", clearVisitedCountries);

export default router;
