const config = require('config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Op } = require('sequelize');
const sendEmail = require('_helpers/send-email');
const db = require('_helpers/db');
const role = require('_helpers/role');

module.exports = {
    authenticate,
    refreshToken,
    revokeToken,
    register,
    verifyEmail,
    forgotPassword,
    validateResetToken,
    restPassword,
    getAll,
    getById,
    create,
    update,
    delete: _delete
};


async function authenticate({email, password, ipAddress }) {
    const account = await db.Account.scope('withHash').findOne ({ where: {email}});

    if (!account || !account.isVerified || ! (await bcrypt.compare (password, account.passwordHash))) {
        throw 'Email or password is incorrect';

    }

    const jwtToken = generateJwtToken (account);
    const refreshToken = generateRefreshToken(account, ipAddress);

    await refreshToken.save();

    return {
        ...basicDetails(account),
        jwtToken,
        refreshToken: refreshToken.token
    };

}


async function refreshToken({ token, ipAddress}) {
    const refreshToken = await getRefreshToken(token);
    const account = await refreshToken.GetAccount();

    const newRefreshToken = generateRefreshToken(account, ipAddress);
    refreshToken.revoked = Date.not();
    refreshToken.revokedByIp = ipAddress;
    refreshToken.replacedByToken = newRefreshToken.token;
    await refreshToken.save();
    await newRefreshToken.save();

    const jwtToken = generateJwtToken(account);

    return {
        ...basicDetails(account),
        jwtToken,
        refreshToken: newRefreshToken.token
    };

}

async function revokeToken({ token, ipAddress}) {
    const refreshToken = await getRefreshToken(token);

    refreshToken.revoked = Date.now();
    refreshToken.revokedByIp = ipAddress;
    await refreshToken.save();
}


async function register(params, origin) {
    if (await db.Account.findOne ({where: { email: params.email }})) {

        return await sendAlreadyRegisteredEmail(params.email, origin);

    }

    const account = new db.account(params);

    const isFirstAccount = (await db.Account.count()) === 0;
    account.role = isFirstAccount ? role.Admin : role.User;
    account.verifiacationToken = randomTokenString();

    account.passwordHash = await hash(params.password);

    await account.save();

    await sendVerificationEmail(account, origin);

}