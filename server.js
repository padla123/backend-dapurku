require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

app.use(cors());
app.use(express.json());


// ======================
// SWAGGER
// ======================

const options = {
  definition: {
    openapi: '3.0.0',

    info: {
      title: 'DapurKu API',
      version: '1.0.0',
      description: 'API aplikasi resep makanan React Native',
    },

    servers: [
      {
        url: 'http://localhost:5000',
      },
    ],
  },

  apis: ['./server.js'],
};

const swaggerSpec = swaggerJsdoc(options);

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);


// ======================
// DATABASE
// ======================

const db = mysql.createConnection({

  host: process.env.DB_HOST,

  user: process.env.DB_USER,

  password: process.env.DB_PASSWORD,

  database: process.env.DB_NAME,

});


db.connect((err) => {

  if (err) {

    console.log(
      'Database gagal connect:',
      err
    );

  } else {

    console.log(
      'Database berhasil connect!'
    );

  }

});


// ======================
// TEST API
// ======================

app.get('/', (req, res) => {

  res.send(
    'Backend API berjalan 🚀'
  );

});
// ======================
// GET ALL RECIPES
// ======================

/**
 * @swagger
 * /recipes:
 *   get:
 *     summary: Ambil semua resep
 *     tags:
 *       - Recipes
 *     responses:
 *       200:
 *         description: Berhasil mengambil data resep
 */
app.get('/recipes', (req, res) => {

  const sql =
    'SELECT * FROM recipes ORDER BY id DESC';

  db.query(sql, (err, result) => {

    if (err) {

      return res.status(500).json({

        message:
          'Gagal mengambil data',

        error: err

      });

    }

    res.json(result);

  });

});



// ======================
// GET RECIPE BY ID
// ======================

/**
 * @swagger
 * /recipes/{id}:
 *   get:
 *     summary: Ambil detail resep
 *     tags:
 *       - Recipes
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detail resep
 */
app.get('/recipes/:id', (req, res) => {

  const id = req.params.id;

  db.query(

    'SELECT * FROM recipes WHERE id=?',

    [id],

    (err, result) => {

      if (err) {

        return res.status(500).json(err);

      }

      if (result.length === 0) {

        return res.status(404).json({

          message:
            'Resep tidak ditemukan'

        });

      }

      res.json(result[0]);

    }

  );

});



// ======================
// TAMBAH RESEP
// ======================

/**
 * @swagger
 * /recipes:
 *   post:
 *     summary: Tambah resep
 *     tags:
 *       - Recipes
 */
app.post('/recipes', (req, res) => {

  const {

    title,
    description,
    category,
    ingredients,
    steps,
    image

  } = req.body;


  const sql = `

  INSERT INTO recipes

  (

  title,

  description,

  category,

  ingredients,

  steps,

  image

  )

  VALUES(?,?,?,?,?,?)

  `;


  db.query(

    sql,

    [

      title,

      description,

      category,

      ingredients,

      steps,

      image

    ],

    (err, result) => {

      if (err) {

        return res.status(500).json(err);

      }

      res.status(201).json({

        message:
          'Resep berhasil ditambahkan',

        id:
          result.insertId

      });

    }

  );

});



// ======================
// EDIT RESEP
// ======================

/**
 * @swagger
 * /recipes/{id}:
 *   put:
 *     summary: Edit resep
 *     tags:
 *       - Recipes
 */
app.put('/recipes/:id', (req, res) => {

  const id = req.params.id;


  const {

    title,
    description,
    category,
    ingredients,
    steps,
    image

  } = req.body;


  const sql = `

  UPDATE recipes

  SET

  title=?,

  description=?,

  category=?,

  ingredients=?,

  steps=?,

  image=?

  WHERE id=?

  `;


  db.query(

    sql,

    [

      title,

      description,

      category,

      ingredients,

      steps,

      image,

      id

    ],

    (err) => {

      if (err) {

        return res.status(500).json(err);

      }

      res.json({

        message:
          'Resep berhasil diupdate'

      });

    }

  );

});



// ======================
// HAPUS RESEP
// ======================

/**
 * @swagger
 * /recipes/{id}:
 *   delete:
 *     summary: Hapus resep
 *     tags:
 *       - Recipes
 */
app.delete('/recipes/:id', (req, res) => {

  const id = req.params.id;


  db.query(

    'DELETE FROM recipes WHERE id=?',

    [id],

    (err) => {

      if (err) {

        return res.status(500).json(err);

      }

      res.json({

        message:
          'Resep berhasil dihapus'

      });

    }

  );

});
// ======================
// REGISTER
// ======================

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register user baru
 *     tags:
 *       - Auth
 */
app.post('/register', (req, res) => {

  const {
    username,
    email,
    password
  } = req.body;


  if (!username || !email || !password) {

    return res.status(400).json({

      message: 'Semua data wajib diisi'

    });

  }


  db.query(

    'SELECT * FROM users WHERE email=?',

    [email],

    (err, result) => {

      if (err) {

        return res.status(500).json(err);

      }


      if (result.length > 0) {

        return res.status(400).json({

          message: 'Email sudah digunakan'

        });

      }


      const hash = bcrypt.hashSync(

        password,

        10

      );


      const sql = `

      INSERT INTO users

      (

      username,

      email,

      password

      )

      VALUES(?,?,?)

      `;


      db.query(

        sql,

        [

          username,

          email,

          hash

        ],

        (err) => {

          if (err) {

            return res.status(500).json(err);

          }


          res.json({

            message:

            'Register berhasil'

          });

        }

      );


    }

  );


});




// ======================
// LOGIN
// ======================

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login user
 *     tags:
 *       - Auth
 */
app.post('/login', (req, res) => {


  const {

    email,

    password

  } = req.body;



  db.query(

    'SELECT * FROM users WHERE email=?',

    [email],

    (err, result) => {


      if (err) {

        return res.status(500).json(err);

      }


      if (result.length === 0) {

        return res.status(404).json({

          message:

          'Email tidak ditemukan'

        });

      }



      const user = result[0];



      const cek = bcrypt.compareSync(

        password,

        user.password

      );



      if (!cek) {

        return res.status(401).json({

          message:

          'Password salah'

        });

      }



      const token = jwt.sign(

        {

          id: user.id

        },

        process.env.JWT_SECRET,

        {

          expiresIn: '7d'

        }

      );



      res.json({

        message:

        'Login berhasil',

        token,


        user: {

          id: user.id,

          username: user.username,

          email: user.email

        }


      });


    }


  );


});




// ======================
// SERVER
// ======================

app.listen(

  process.env.PORT || 5000,

  () => {

    console.log(

      `Server berjalan di port ${process.env.PORT || 5000}`

    );

  }

);