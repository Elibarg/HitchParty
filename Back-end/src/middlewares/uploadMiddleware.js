const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadsRoot = path.join(__dirname, '..', '..', 'uploads');
const vehicleUploadsDir = path.join(uploadsRoot, 'vehicles');

const allowedMimeTypes = new Map([
    ['image/png', '.png'],
    ['image/jpeg', '.jpg'],
    ['image/webp', '.webp']
]);

// HP-SEC-002 | Upload de veiculos. Limitamos tipo e tamanho para reduzir risco
// de arquivo malicioso e manter a pasta uploads sob controle.
fs.mkdirSync(vehicleUploadsDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, vehicleUploadsDir);
    },
    filename: (req, file, callback) => {
        const extension =
            allowedMimeTypes.get(file.mimetype)
            || path.extname(file.originalname).toLowerCase();

        const safeName = [
            'vehicle',
            req.user?.id || 'user',
            Date.now(),
            Math.round(Math.random() * 1e9)
        ].join('-');

        callback(null, `${safeName}${extension}`);
    }
});

const uploadVehicleImage = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, callback) => {
        if (!allowedMimeTypes.has(file.mimetype)) {
            callback(new Error('Formato inválido. Utilize PNG, JPG ou WEBP.'));
            return;
        }

        callback(null, true);
    }
}).single('image');

function handleVehicleImageUpload(req, res, next) {
    uploadVehicleImage(req, res, error => {
        if (!error) {
            next();
            return;
        }

        const isSizeError = error.code === 'LIMIT_FILE_SIZE';

        return res.status(400).json({
            success: false,
            message: isSizeError
                ? 'A imagem deve possuir no máximo 5 MB.'
                : error.message || 'Erro ao enviar imagem do veículo.'
        });
    });
}

module.exports = {
    handleVehicleImageUpload
};
