// ZIP code to city/state mapping
// In production, this should be replaced with a proper API service like USPS or SmartyStreets

export interface ZipCodeData {
  city: string;
  state: string;
}

export const ZIP_CODE_DATABASE: { [key: string]: ZipCodeData } = {
  // New York
  '10001': { city: 'New York', state: 'NY' },
  '10002': { city: 'New York', state: 'NY' },
  '10003': { city: 'New York', state: 'NY' },
  '10004': { city: 'New York', state: 'NY' },
  '10005': { city: 'New York', state: 'NY' },
  
  // California
  '90210': { city: 'Beverly Hills', state: 'CA' },
  '90211': { city: 'Beverly Hills', state: 'CA' },
  '90212': { city: 'Beverly Hills', state: 'CA' },
  '94102': { city: 'San Francisco', state: 'CA' },
  '94103': { city: 'San Francisco', state: 'CA' },
  
  // Illinois
  '60601': { city: 'Chicago', state: 'IL' },
  '60602': { city: 'Chicago', state: 'IL' },
  '60603': { city: 'Chicago', state: 'IL' },
  '60604': { city: 'Chicago', state: 'IL' },
  '60605': { city: 'Chicago', state: 'IL' },
  
  // Texas
  '77001': { city: 'Houston', state: 'TX' },
  '77002': { city: 'Houston', state: 'TX' },
  '77003': { city: 'Houston', state: 'TX' },
  '75201': { city: 'Dallas', state: 'TX' },
  '75202': { city: 'Dallas', state: 'TX' },
  
  // Florida
  '33101': { city: 'Miami', state: 'FL' },
  '33102': { city: 'Miami', state: 'FL' },
  '33103': { city: 'Miami', state: 'FL' },
  '33104': { city: 'Miami', state: 'FL' },
  '33105': { city: 'Miami', state: 'FL' },
  
  // Washington
  '98101': { city: 'Seattle', state: 'WA' },
  '98102': { city: 'Seattle', state: 'WA' },
  '98103': { city: 'Seattle', state: 'WA' },
  '98104': { city: 'Seattle', state: 'WA' },
  '98105': { city: 'Seattle', state: 'WA' },
  
  // Massachusetts
  '02101': { city: 'Boston', state: 'MA' },
  '02102': { city: 'Boston', state: 'MA' },
  '02103': { city: 'Boston', state: 'MA' },
  '02104': { city: 'Boston', state: 'MA' },
  '02105': { city: 'Boston', state: 'MA' },
  
  // Georgia
  '30301': { city: 'Atlanta', state: 'GA' },
  '30302': { city: 'Atlanta', state: 'GA' },
  '30303': { city: 'Atlanta', state: 'GA' },
  '30304': { city: 'Atlanta', state: 'GA' },
  '30305': { city: 'Atlanta', state: 'GA' },
  
  // Colorado
  '80201': { city: 'Denver', state: 'CO' },
  '80202': { city: 'Denver', state: 'CO' },
  '80203': { city: 'Denver', state: 'CO' },
  '80204': { city: 'Denver', state: 'CO' },
  '80205': { city: 'Denver', state: 'CO' },
  
  // Arizona
  '85001': { city: 'Phoenix', state: 'AZ' },
  '85002': { city: 'Phoenix', state: 'AZ' },
  '85003': { city: 'Phoenix', state: 'AZ' },
  '85004': { city: 'Phoenix', state: 'AZ' },
  '85005': { city: 'Phoenix', state: 'AZ' },
};

export function getLocationFromZipCode(zipCode: string): ZipCodeData | null {
  return ZIP_CODE_DATABASE[zipCode] || null;
}

export function validateUSZipCode(zipCode: string): boolean {
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zipCode) && ZIP_CODE_DATABASE.hasOwnProperty(zipCode.split('-')[0]);
}