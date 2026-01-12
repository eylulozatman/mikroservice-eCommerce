const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Saga Step Status
 */
const SAGA_STEP_STATUS = {
    PENDING: 'PENDING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
    COMPENSATING: 'COMPENSATING',
    COMPENSATED: 'COMPENSATED'
};

/**
 * SagaState Model
 * Tracks the execution state of the Saga for potential compensation/rollback
 */
const SagaState = sequelize.define('SagaState', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    orderId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        field: 'order_id',
        references: {
            model: 'orders',
            key: 'id'
        }
    },
    currentStep: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'INIT',
        field: 'current_step'
    },
    completedSteps: {
        type: DataTypes.JSONB,
        defaultValue: [],
        field: 'completed_steps'
    },
    failedStep: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'failed_step'
    },
    failureReason: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'failure_reason'
    },
    compensationRequired: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'compensation_required'
    },
    compensationStatus: {
        type: DataTypes.ENUM('NONE', 'IN_PROGRESS', 'COMPLETED', 'FAILED'),
        defaultValue: 'NONE',
        field: 'compensation_status'
    },
    stepDetails: {
        type: DataTypes.JSONB,
        defaultValue: {},
        field: 'step_details'
    }
}, {
    tableName: 'saga_states',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

/**
 * Mark a step as completed
 */
SagaState.prototype.completeStep = async function (stepName, details = {}) {
    const completedSteps = this.completedSteps || [];
    completedSteps.push({
        step: stepName,
        status: SAGA_STEP_STATUS.COMPLETED,
        completedAt: new Date().toISOString(),
        details
    });
    this.completedSteps = completedSteps;
    this.currentStep = stepName;

    // Update step details
    const stepDetails = this.stepDetails || {};
    stepDetails[stepName] = { status: 'completed', ...details };
    this.stepDetails = stepDetails;

    return this.save();
};

/**
 * Mark a step as failed and trigger compensation
 */
SagaState.prototype.failStep = async function (stepName, reason) {
    this.failedStep = stepName;
    this.failureReason = reason;
    this.compensationRequired = true;
    this.compensationStatus = 'IN_PROGRESS';

    return this.save();
};

/**
 * Mark compensation as complete
 */
SagaState.prototype.completeCompensation = async function () {
    this.compensationStatus = 'COMPLETED';
    return this.save();
};

module.exports = { SagaState, SAGA_STEP_STATUS };
