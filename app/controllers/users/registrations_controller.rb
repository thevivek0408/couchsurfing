class Users::RegistrationsController < Devise::RegistrationsController
  def create
    super do |resource|
      resource.role = Role.find_by(name: 'guest')
      resource.save
    end
  end
end
