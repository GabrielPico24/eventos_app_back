const { loginUser } = require('../services/auth.service');

const login = async (req, res) => {
  try {
    console.log('📥 BODY LOGIN:', req.body);

    const { email, password } = req.body;
    const data = await loginUser({ email, password });

    console.log('📤 RESPUESTA LOGIN:', JSON.stringify({
      ok: true,
      message: 'Login exitoso',
      data,
    }, null, 2));

    return res.status(200).json({
      ok: true,
      message: 'Login exitoso',
      data,
    });
  } catch (error) {
    console.log('❌ ERROR LOGIN:', error.message);

    return res.status(400).json({
      ok: false,
      message: error.message,
    });
  }
};

module.exports = {
  login,
};