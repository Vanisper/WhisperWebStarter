import {
    ClassName,
    Dictionary,
    FieldName, Type,
} from '@core/decorator/Custom';
import { EntityConfig } from '@core/decorator/EntityConfig';
import { FormField } from '@core/decorator/FormField';
import { SearchField } from '@core/decorator/SearchField';
import { TableField } from '@core/decorator/TableField';
import { BaseEntity } from '@/base/BaseEntity';
import { ITree } from '@core/interface/ITree';
import { PermissionSystemDictionary } from './PermissionSystemDictionary';
import { CoreModel } from '@core/base/CoreModel';
import { CoreFormFieldConfig } from '@core/config/CoreFormFieldConfig';
import { CoreSearchFieldConfig } from '@core/config/CoreSearchFieldConfig';
import { CoreTableFieldConfig } from '@core/config/CoreTableFieldConfig';
import { IJson } from '@core/interface/IJson';

/**
 * # 权限
 * @author Hamm
 */
@EntityConfig({
    addChildPermission: 'add',
})
@ClassName('权限')
export class PermissionEntity extends BaseEntity implements ITree {
    id: number;
    recoverBy(obj: CoreModel | IJson): this {
        throw new Error('Method not implemented.');
    }
    copy(): this {
        throw new Error('Method not implemented.');
    }
    expose(...fields: string[]): this {
        throw new Error('Method not implemented.');
    }
    exclude(...fields: string[]): this {
        throw new Error('Method not implemented.');
    }
    toJson(): IJson {
        throw new Error('Method not implemented.');
    }
    getClassName(): string {
        throw new Error('Method not implemented.');
    }
    getFieldName(fieldKey: string): string {
        throw new Error('Method not implemented.');
    }
    getCustomFormFieldConfig(fieldKey: string): CoreFormFieldConfig | null {
        throw new Error('Method not implemented.');
    }
    getFormFieldLabel(fieldKey: string): string {
        throw new Error('Method not implemented.');
    }
    getTableFieldConfigList(fieldNameList?: string[]): CoreTableFieldConfig[] {
        throw new Error('Method not implemented.');
    }
    getFormFieldConfigList(fieldNameList?: string[]): CoreFormFieldConfig[] {
        throw new Error('Method not implemented.');
    }
    getSearchFieldConfigList(fieldNameList?: string[]): CoreSearchFieldConfig[] {
        throw new Error('Method not implemented.');
    }
  /**
   * # 权限名称
   */
  @TableField({
      forceShow: true,
  })
  @SearchField()
  @FormField({
      requiredString: true,
  })
  @Type(String)
  @FieldName('权限名称') name!: string;

  /**
   * # 权限唯一标识
   */
  @TableField({
      forceShow: true,
      copyField: true,
  })
  @FormField({
      requiredString: '请输入权限标识...',
  })
  @FieldName('权限标识') identity!: string;

  /**
   * # 权限类别
   */
  @Dictionary(PermissionSystemDictionary)
  @TableField({
      showColor: true,
      width: 100,
      orderNumber: -100,
  })
  @FieldName('类别') isSystem!: boolean;

  /**
   * # 父权限ID
   */
  @FieldName('父级ID') parentId!: number;

  /**
   * # 子权限列表
   */
  // eslint-disable-next-line no-use-before-define
  @Type(PermissionEntity, true) children!: this[];

  /**
   * # 父权限
   */
  // eslint-disable-next-line no-use-before-define
  @Type(PermissionEntity) parent!: this;

  @TableField({
      removed: true,
  })
  declare createTime: number;

  @TableField({
      removed: true,
  })
  declare isDisabled: boolean;
}
