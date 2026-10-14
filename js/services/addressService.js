/**
 * ADDRESS SERVICE — Sistema de gestión de direcciones guardadas
 */
import { StorageService } from './storageService.js';

const ADDRESSES_KEY = 'addresses';

function initDemoAddresses() {
  const allAddresses = StorageService.get(ADDRESSES_KEY, {});
  if (!allAddresses['usr_demo_1'] || allAddresses['usr_demo_1'].length === 0) {
    allAddresses['usr_demo_1'] = [
      {
        id: 'addr_demo_1',
        name: 'Casa',
        street: 'Av. Rivadavia',
        number: '21450',
        floorApt: 'Piso 2 Dpto B',
        city: 'Ituzaingó',
        postalCode: '1714',
        references: 'Entre Soler y Mansilla. Timbre blanco con reja negra.',
        isDefault: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'addr_demo_2',
        name: 'Local / Comercio',
        street: 'Mariano Acosta',
        number: '120',
        floorApt: 'Planta Baja',
        city: 'Ituzaingó',
        postalCode: '1714',
        references: 'Frente a la plaza. Horario de recepción 9 a 18 hs.',
        isDefault: false,
        createdAt: new Date().toISOString()
      }
    ];
    StorageService.set(ADDRESSES_KEY, allAddresses);
  }
}

initDemoAddresses();

export const AddressService = {
  getAddresses(userId) {
    if (!userId) return [];
    const all = StorageService.get(ADDRESSES_KEY, {});
    return all[userId] || [];
  },

  getDefaultAddress(userId) {
    const list = this.getAddresses(userId);
    return list.find(a => a.isDefault) || list[0] || null;
  },

  addAddress(userId, data) {
    if (!userId) throw new Error('Usuario no identificado.');
    if (!data.street || !data.number || !data.city) {
      throw new Error('Completá calle, altura y localidad obligatoriamente.');
    }

    const all = StorageService.get(ADDRESSES_KEY, {});
    const userList = all[userId] || [];

    const isFirst = userList.length === 0;
    const shouldBeDefault = data.isDefault || isFirst;

    if (shouldBeDefault) {
      userList.forEach(a => a.isDefault = false);
    }

    const newAddr = {
      id: 'addr_' + Date.now(),
      name: data.name?.trim() || 'Principal',
      street: data.street.trim(),
      number: data.number.trim(),
      floorApt: data.floorApt?.trim() || '',
      city: data.city.trim(),
      postalCode: data.postalCode?.trim() || '',
      references: data.references?.trim() || '',
      isDefault: shouldBeDefault,
      createdAt: new Date().toISOString()
    };

    userList.push(newAddr);
    all[userId] = userList;
    StorageService.set(ADDRESSES_KEY, all);

    return newAddr;
  },

  updateAddress(userId, addressId, data) {
    const all = StorageService.get(ADDRESSES_KEY, {});
    const userList = all[userId] || [];
    const index = userList.findIndex(a => a.id === addressId);
    if (index === -1) throw new Error('Dirección no encontrada.');

    if (data.isDefault) {
      userList.forEach(a => a.isDefault = false);
    }

    userList[index] = {
      ...userList[index],
      name: data.name?.trim() || userList[index].name,
      street: data.street?.trim() || userList[index].street,
      number: data.number?.trim() || userList[index].number,
      floorApt: data.floorApt?.trim() ?? userList[index].floorApt,
      city: data.city?.trim() || userList[index].city,
      postalCode: data.postalCode?.trim() ?? userList[index].postalCode,
      references: data.references?.trim() ?? userList[index].references,
      isDefault: data.isDefault !== undefined ? data.isDefault : userList[index].isDefault
    };

    all[userId] = userList;
    StorageService.set(ADDRESSES_KEY, all);
    return userList[index];
  },

  deleteAddress(userId, addressId) {
    const all = StorageService.get(ADDRESSES_KEY, {});
    let userList = all[userId] || [];
    const deletedWasDefault = userList.find(a => a.id === addressId)?.isDefault;

    userList = userList.filter(a => a.id !== addressId);
    if (deletedWasDefault && userList.length > 0) {
      userList[0].isDefault = true;
    }

    all[userId] = userList;
    StorageService.set(ADDRESSES_KEY, all);
    return true;
  },

  setDefault(userId, addressId) {
    const all = StorageService.get(ADDRESSES_KEY, {});
    const userList = all[userId] || [];
    userList.forEach(a => {
      a.isDefault = a.id === addressId;
    });
    all[userId] = userList;
    StorageService.set(ADDRESSES_KEY, all);
    return true;
  }
};
