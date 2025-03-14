import express from "express";
import passport from "passport";
const router = express.Router();

// GitHub OAuth login route
router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

// GitHub OAuth callback route
router.get(
  "/github/callback",
  passport.authenticate("github", { failureRedirect: "/login" }),
  (req, res) => {
    // Successful authentication, redirect to home or room page
    res.redirect("http://localhost:3000/home");
  }
);

router.get("/current-user", (req, res) => {
  if (req.isAuthenticated()) {
    console.log("User Authenticated!!");
    res.json({ user: req.user });
  } else {
    console.log("User Not Authenticated!!");
    res.status(401).json({ message: "Not authenticated" });
  }
});

// Logout route
router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    res.redirect("/");
  });
});

export default router;
