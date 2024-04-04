const { DataTypes } = require('sequelize');

module.exports = model;

function model (sequelize) {
    const attributes = {
        token: { type: DataTypes.STRING},
        expires: { type: DataTypes.DATE},
        created: {type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW},
        createByIp: { type: DataTypes.STRING},
        revoked: { type: DataTypes.DATE},
        revokedByIp: { type: DataTypes.STRING},
        replacedByToken: { type: DataTypes.STRING},
        isExpired:{
            tpye: DataTypes.VIRTUAL,
            get() { return Date.now() >= this.expires;}
        
        },

        isActive: {
            type: DataTypes.VIRTUAL,
            get() {return !this.revoked && !this.isExpired; }
        }

    };

    const options = {
        timestamps: false
    };

    return sequelize.define('refreshToken', attributes, options);
    
}