const router = express.Router();
const auth = require('../lib/jwtAuth');
const Project = require('../models/Project');

router.post('/', auth, async (req, res) => {
  try {
    const project = new Project({
      user: req.user._id,
      ...req.body
    });
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});