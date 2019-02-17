const mongoose = require("mongoose");
const schema = mongoose.Schema;

const locationModel = new schema({
  location: {
    type: {
      type: String, // Don't do `{ location: { type: String } }`
      enum: ["Point"], // 'location.type' must be 'Point'
      required: true,
      default: "Point"
    },
    coordinates: {
      type: [Number],
      required: true,
      default: [0, 0]
    }
  },
  type: String,
  identity: { type: mongoose.Schema.Types.ObjectId, ref: "UserInfo" }
});
locationModel.index({ location: "2dsphere" });
module.exports = mongoose.model("locationInfo", locationModel);
