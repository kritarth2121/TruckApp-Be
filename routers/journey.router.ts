import {createJourney, listJourney, listJourneyDriver, updateJourneyStatus} from "../controllers/journey.controller";
import express from "express";
import {authenticate} from "../middleware/authenticate";
const router = express.Router();

router.route("/").post(authenticate, createJourney);
router.route("/").get(authenticate, listJourney);
router.route("/driver").get(authenticate, listJourneyDriver);
router.route("/:journeyId").put(authenticate, updateJourneyStatus);

export  const journeyRouter = router;