import express from "express";
import {   getAllUsers,getOneUser,updateUser, deleteUser,createUser } from "./user.controller.js";
const router = express.Router();

router.get("/", getAllUsers);


router.get("/:id", getOneUser);


router.post("/",createUser );


router.patch("/:id", updateUser);


router.delete("/:id", deleteUser);

export default router;