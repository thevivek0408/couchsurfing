class AddNameToRoles < ActiveRecord::Migration[5.2]
  def change
    add_column :roles, :name, :string
  end
end
