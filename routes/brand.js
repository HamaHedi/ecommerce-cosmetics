const express = require("express");
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");
const {
  getBrands,
  getSingleBrand,
  createBrand,
  deleteBrand,
  updateBrand,
} = require("../controllers/brand");

router.route("/brands").get(getBrands);

router.route("/brands/:id").get(getSingleBrand);

router
  .route("/brands")
  .post(isAuthenticatedUser, authorizeRoles("admin"), createBrand);
router
  .route("/brands/:id")
  .put(isAuthenticatedUser, authorizeRoles("admin"), updateBrand);
router
  .route("/brands/:id")
  .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteBrand);

module.exports = router;
