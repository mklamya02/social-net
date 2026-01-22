const express = require("express");
const router = express.Router();
const authenticate  = require("../middlewares/auth");
const userController=require("../controllers/user.controller");
const {updateProfile, getUserById}=userController;
const upload = require("../middlewares/avatarUpload"); 
const pagination = require("../middlewares/pagination");
router.patch(
  '/me',
  authenticate,
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'banner', maxCount: 1 }
  ]),
  updateProfile
);

const optionalAuth = require("../middlewares/optionalAuth");
router.get('/suggestions', authenticate, userController.getSuggestions);
router.delete('/me', authenticate, userController.deleteAccount);
router.put('/privacy', authenticate, userController.updatePrivacy);
router.patch('/change-password', authenticate, userController.changePassword);
router.post('/interests', authenticate, userController.saveInterests);
router.get('/:userId', optionalAuth, getUserById);
router.get('/:userId/posts', optionalAuth, pagination, userController.getUserPosts);

module.exports = router;
