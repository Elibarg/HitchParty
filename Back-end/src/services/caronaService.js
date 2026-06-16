// src/services/caronaService.js

const caronaRepository =
    require('../repositories/caronaRepository');

async function buscarCaronas() {

    return await
        caronaRepository.listarTodas();

}

module.exports = {
    buscarCaronas
};