export interface ValidationRule {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    email?: boolean;
    url?: boolean;
    min?: number;
    max?: number;
    custom?: (value: any) => string | null;
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

export interface FieldValidation {
    value: any;
    rules: ValidationRule;
    fieldName?: string;
}

export class Validator {
    /**
     * 验证单个字段
     */
    static validateField(field: FieldValidation): ValidationResult {
        const errors: string[] = [];
        const { value, rules, fieldName = '字段' } = field;
        
        // 处理空值检查
        if (rules.required && this.isEmpty(value)) {
            errors.push(`${fieldName}不能为空`);
            return { isValid: false, errors };
        }
        
        // 如果值为空且不是必填字段，直接返回通过
        if (this.isEmpty(value)) {
            return { isValid: true, errors: [] };
        }
        
        // 字符串验证
        if (typeof value === 'string') {
            if (rules.minLength !== undefined && value.length < rules.minLength) {
                errors.push(`${fieldName}长度不能少于${rules.minLength}个字符`);
            }
            
            if (rules.maxLength !== undefined && value.length > rules.maxLength) {
                errors.push(`${fieldName}长度不能超过${rules.maxLength}个字符`);
            }
            
            if (rules.pattern && !rules.pattern.test(value)) {
                errors.push(`${fieldName}格式不正确`);
            }
            
            if (rules.email && !this.isEmail(value)) {
                errors.push(`${fieldName}邮箱格式不正确`);
            }
            
            if (rules.url && !this.isUrl(value)) {
                errors.push(`${fieldName}URL格式不正确`);
            }
        }
        
        // 数字验证
        if (typeof value === 'number' || !isNaN(Number(value))) {
            const numValue = Number(value);
            
            if (rules.min !== undefined && numValue < rules.min) {
                errors.push(`${fieldName}不能小于${rules.min}`);
            }
            
            if (rules.max !== undefined && numValue > rules.max) {
                errors.push(`${fieldName}不能大于${rules.max}`);
            }
        }
        
        // 自定义验证
        if (rules.custom) {
            const customError = rules.custom(value);
            if (customError) {
                errors.push(customError);
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    /**
     * 验证表单
     */
    static validateForm(fields: Record<string, FieldValidation>): Record<string, ValidationResult> {
        const results: Record<string, ValidationResult> = {};
        
        Object.entries(fields).forEach(([fieldName, field]) => {
            results[fieldName] = this.validateField({
                ...field,
                fieldName: field.fieldName || this.capitalizeFirstLetter(fieldName)
            });
        });
        
        return results;
    }
    
    /**
     * 检查表单是否全部有效
     */
    static isFormValid(validationResults: Record<string, ValidationResult>): boolean {
        return Object.values(validationResults).every(result => result.isValid);
    }
    
    /**
     * 获取所有错误信息
     */
    static getAllErrors(validationResults: Record<string, ValidationResult>): string[] {
        const errors: string[] = [];
        
        Object.values(validationResults).forEach(result => {
            errors.push(...result.errors);
        });
        
        return errors;
    }
    
    /**
     * 创建验证规则
     */
    static createRules(rules: ValidationRule): ValidationRule {
        return rules;
    }
    
    /**
     * 常用规则预设
     */
    static rules = {
        required: (message?: string): ValidationRule => ({
            required: true,
            custom: (value) => this.isEmpty(value) ? (message || '不能为空') : null
        }),
        
        email: (message?: string): ValidationRule => ({
            email: true,
            custom: (value) => !this.isEmail(value) ? (message || '邮箱格式不正确') : null
        }),
        
        url: (message?: string): ValidationRule => ({
            url: true,
            custom: (value) => !this.isUrl(value) ? (message || 'URL格式不正确') : null
        }),
        
        minLength: (min: number, message?: string): ValidationRule => ({
            minLength: min,
            custom: (value) => value && value.length < min 
                ? (message || `长度不能少于${min}个字符`) 
                : null
        }),
        
        maxLength: (max: number, message?: string): ValidationRule => ({
            maxLength: max,
            custom: (value) => value && value.length > max 
                ? (message || `长度不能超过${max}个字符`) 
                : null
        }),
        
        pattern: (pattern: RegExp, message?: string): ValidationRule => ({
            pattern,
            custom: (value) => value && !pattern.test(value) 
                ? (message || '格式不正确') 
                : null
        }),
        
        min: (min: number, message?: string): ValidationRule => ({
            min,
            custom: (value) => {
                const num = Number(value);
                return !isNaN(num) && num < min 
                    ? (message || `不能小于${min}`) 
                    : null;
            }
        }),
        
        max: (max: number, message?: string): ValidationRule => ({
            max,
            custom: (value) => {
                const num = Number(value);
                return !isNaN(num) && num > max 
                    ? (message || `不能大于${max}`) 
                    : null;
            }
        }),
        
        // 组合规则
        password: (minLength: number = 8): ValidationRule => ({
            required: true,
            minLength,
            pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            custom: (value) => {
                if (!value) return '密码不能为空';
                if (value.length < minLength) return `密码长度不能少于${minLength}个字符`;
                if (!/(?=.*[a-z])/.test(value)) return '密码必须包含小写字母';
                if (!/(?=.*[A-Z])/.test(value)) return '密码必须包含大写字母';
                if (!/(?=.*\d)/.test(value)) return '密码必须包含数字';
                return null;
            }
        }),
        
        phone: (): ValidationRule => ({
            pattern: /^1[3-9]\d{9}$/,
            custom: (value) => value && !/^1[3-9]\d{9}$/.test(value) 
                ? '手机号格式不正确' 
                : null
        }),
        
        idCard: (): ValidationRule => ({
            pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/,
            custom: (value) => value && !/(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/.test(value)
                ? '身份证号格式不正确'
                : null
        })
    };
    
    /**
     * 辅助方法
     */
    private static isEmpty(value: any): boolean {
        if (value === null || value === undefined) {
            return true;
        }
        
        if (typeof value === 'string' && value.trim() === '') {
            return true;
        }
        
        if (Array.isArray(value) && value.length === 0) {
            return true;
        }
        
        if (typeof value === 'object' && Object.keys(value).length === 0) {
            return true;
        }
        
        return false;
    }
    
    private static isEmail(value: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
    }
    
    private static isUrl(value: string): boolean {
        try {
            new URL(value);
            return true;
        } catch {
            return false;
        }
    }
    
    private static capitalizeFirstLetter(string: string): string {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
}

/**
 * 表单验证器
 */
export class FormValidator<T extends Record<string, any>> {
    private validations: Record<keyof T, ValidationRule>;
    
    constructor(validations: Record<keyof T, ValidationRule>) {
        this.validations = validations;
    }
    
    /**
     * 验证表单数据
     */
    validate(data: T): Record<keyof T, ValidationResult> {
        const fields: Record<string, FieldValidation> = {};
        
        Object.keys(this.validations).forEach((fieldName) => {
            fields[fieldName] = {
                value: data[fieldName],
                rules: this.validations[fieldName as keyof T]
            };
        });
        
        return Validator.validateForm(fields) as Record<keyof T, ValidationResult>;
    }
    
    /**
     * 检查表单是否有效
     */
    isValid(data: T): boolean {
        const results = this.validate(data);
        return Validator.isFormValid(results);
    }
}

/**
 * 便捷验证函数
 */
export const validate = {
    field: (field: FieldValidation) => Validator.validateField(field),
    form: (fields: Record<string, FieldValidation>) => Validator.validateForm(fields),
    isFormValid: (results: Record<string, ValidationResult>) => Validator.isFormValid(results),
    rules: Validator.rules
};