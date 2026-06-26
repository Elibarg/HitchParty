const veiculoRepository = require('../repositories/veiculoRepository');

// HP-VEH-002 | Service de veiculos: valida formulario, normaliza numeros e
// decide como tratar imagem antes de enviar os dados ao repository.
function validarVeiculo(veiculo) {
    if (!veiculo.brand || !veiculo.model || !veiculo.color) {
        throw new Error('Marca, modelo e cor são obrigatórios.');
    }

    if (!veiculo.licensePlate && !veiculo.plate) {
        throw new Error('Placa é obrigatória.');
    }

    const year = Number(veiculo.year);
    const seats = Number(veiculo.seats);

    if (!Number.isInteger(year) || year < 1980 || year > new Date().getFullYear() + 1) {
        throw new Error('Ano do veículo inválido.');
    }

    if (!Number.isInteger(seats) || seats < 1 || seats > 8) {
        throw new Error('Quantidade de assentos inválida.');
    }
}

async function criarVeiculo(userId, veiculo) {
    validarVeiculo(veiculo);

    return veiculoRepository.criarVeiculo(userId, {
        ...veiculo,
        year: Number(veiculo.year),
        seats: Number(veiculo.seats),
        imageUrl: veiculo.removeImage ? null : veiculo.imageUrl || null
    });
}

async function listarVeiculos(userId) {
    return veiculoRepository.listarPorUsuario(userId);
}

async function atualizarVeiculo(userId, vehicleId, veiculo) {
    validarVeiculo(veiculo);

    const currentVehicle = await veiculoRepository.buscarPorId(vehicleId, userId);

    if (!currentVehicle) {
        throw new Error('Veículo não encontrado.');
    }

    const vehicle = await veiculoRepository.atualizarVeiculo(vehicleId, userId, {
        ...veiculo,
        year: Number(veiculo.year),
        seats: Number(veiculo.seats),
        imageUrl: resolverImagemVeiculo(currentVehicle, veiculo)
    });

    if (!vehicle) {
        throw new Error('Veículo não encontrado.');
    }

    return vehicle;
}

function resolverImagemVeiculo(currentVehicle, veiculo) {
    if (veiculo.removeImage) return null;
    if (veiculo.imageUrl) return veiculo.imageUrl;
    return currentVehicle.imageUrl || null;
}

async function removerVeiculo(userId, vehicleId) {
    const vehicle = await veiculoRepository.buscarPorId(vehicleId, userId);

    if (!vehicle) {
        throw new Error('Veículo não encontrado.');
    }

    await veiculoRepository.removerVeiculo(vehicleId, userId);
}

module.exports = {
    criarVeiculo,
    listarVeiculos,
    atualizarVeiculo,
    removerVeiculo
};
