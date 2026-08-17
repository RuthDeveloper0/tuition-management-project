import Child from '../models/Child.js';

// קבלת כל הילדים
export const getChildren = async (req, res) => {
  try {
    const children = await Child.find();
    res.json(children);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// קבלת ילד לפי ID
export const getChildById = async (req, res) => {
  try {
    const child = await Child.findById(req.params.id);
    if (!child) {
      return res.status(404).json({ message: 'Child not found' });
    }
    res.json(child);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// עדכון פרטי ילד
export const updateChild = async (req, res) => {
  try {
    const updatedChild = await Child.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedChild);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// מחיקת ילד
export const deleteChild = async (req, res) => {
  try {
    await Child.findByIdAndDelete(req.params.id);
    res.json({ message: 'Child deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};