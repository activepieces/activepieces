import { createPiece } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { captchaSolverAuth } from "./lib/auth";
import { solveCaptchaAction } from "./lib/actions/solve-captcha";
import { captchaSolvedTrigger } from "./lib/triggers/captcha-solved";

export const captchaSolver = createPiece({
  displayName: "CAPTCHA Solver",
  description: "Automatically solve CAPTCHAs during automation tasks using 2Captcha, Anti-Captcha, or CapSolver.",
  logoUrl: "https://cdn.activepieces.com/pieces/captcha-solver.png",
  authors: ["Abanoub Gerges Azer"],
  auth: captchaSolverAuth,
  minimumSupportedRelease: "0.30.0",
  categories: [PieceCategory.UTILITIES],
  actions: [solveCaptchaAction],
  triggers: [captchaSolvedTrigger],
});
