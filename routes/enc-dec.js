const express = require('express');
const router = express.Router();
const common = require("../config/common");

router.get('/', (req, res) => {
    res.render('enc_dec', { result: undefined, input: '', type: 'encrypt', jsonObj: null });
});

router.post('/', (req, res) => {
    console.log(req.body);
    const { data, type } = req.body;
    console.log("hellooooooo",data);
    let result = '';
    let jsonObj = null;

    if (!data) {
        return res.render('enc_dec', { result: 'No data provided.', input: '', type, jsonObj: null });
    }

    if (type === 'encrypt') {
        result = common.encrypt(data);
    } else if (type === 'decrypt') {
        try {
            result = common.decrypt(data); // <-- FIXED
        } catch (err) {
            result = 'Decryption failed. Invalid input or wrong key/IV.';
        }
    }

    res.render('enc_dec', { result, input: data, type, jsonObj: null });
});

module.exports = router;
