import mongoose from "mongoose"

const addressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true
  },
  street:    { type: String, required: true },
  city:      { type: String, required: true },
  state:     { type: String, default: "" },
  zip:       { type: String, required: true },
  country:   { type: String, required: true },
  isDefault: { type: Boolean, default: false }
}, { timestamps: true })

const AddressModel = mongoose.model("address", addressSchema)
export default AddressModel