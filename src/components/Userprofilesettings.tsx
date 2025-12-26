// // Příklad: UserProfileSettings.tsx
// // Ukázka použití metod updateUser a deleteUser

// import { useState } from 'react';
// import { recipeApi, ValidationError } from '../api/recipeApi';
// import type { User } from '../types';

// export function UserProfileSettings({ user, onUserUpdate }: { user: User; onUserUpdate: (user: User) => void }) {
//     const [formData, setFormData] = useState({
//         name: user.name,
//         email: user.email,
//         password: '',
//         password_confirmation: '',
//     });
//     const [deletePassword, setDeletePassword] = useState('');
//     const [errors, setErrors] = useState<Record<string, string[]>>({});
//     const [isLoading, setIsLoading] = useState(false);
//     const [successMessage, setSuccessMessage] = useState('');
//     const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

//     // ✅ Editace uživatele
//     const handleUpdate = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setErrors({});
//         setSuccessMessage('');
//         setIsLoading(true);

//         try {
//             // Odešli pouze vyplněná pole
//             const updateData: Record<string, string> = {};

//             if (formData.name !== user.name) {
//                 updateData.name = formData.name;
//             }

//             if (formData.email !== user.email) {
//                 updateData.email = formData.email;
//             }

//             if (formData.password) {
//                 updateData.password = formData.password;
//                 updateData.password_confirmation = formData.password_confirmation;
//             }

//             // Pokud není co aktualizovat
//             if (Object.keys(updateData).length === 0) {
//                 setSuccessMessage('Nebyly provedeny žádné změny.');
//                 setIsLoading(false);
//                 return;
//             }

//             const response = await recipeApi.updateUser(updateData);

//             setSuccessMessage(response.message);
//             onUserUpdate(response.user);

//             // Vyčisti hesla po úspěšné změně
//             setFormData(prev => ({
//                 ...prev,
//                 password: '',
//                 password_confirmation: '',
//             }));

//         } catch (error) {
//             if (error instanceof ValidationError) {
//                 setErrors(error.errors);
//             } else if (error instanceof Error) {
//                 setErrors({ general: [error.message] });
//             }
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     // ✅ Smazání uživatele
//     const handleDelete = async () => {
//         if (!deletePassword) {
//             setErrors({ password: ['Zadejte heslo pro potvrzení smazání účtu.'] });
//             return;
//         }

//         setErrors({});
//         setIsLoading(true);

//         try {
//             const response = await recipeApi.deleteUser(deletePassword);

//             // Po úspěšném smazání odhlásit a přesměrovat
//             localStorage.removeItem('token');
//             alert(response.message);
//             window.location.href = '/';

//         } catch (error) {
//             if (error instanceof ValidationError) {
//                 setErrors(error.errors);
//             } else if (error instanceof Error) {
//                 setErrors({ general: [error.message] });
//             }
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <div className="max-w-2xl mx-auto p-6 space-y-8">
//             {/* Formulář pro editaci profilu */}
//             <section className="bg-white rounded-lg shadow p-6">
//                 <h2 className="text-2xl font-bold mb-6">Nastavení profiluxxxxxxxxx</h2>

//                 {successMessage && (
//                     <div className="mb-4 p-4 bg-green-100 text-green-700 rounded">
//                         {successMessage}
//                     </div>
//                 )}

//                 {errors.general && (
//                     <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
//                         {errors.general[0]}
//                     </div>
//                 )}

//                 <form onSubmit={handleUpdate} className="space-y-4">
//                     <div>
//                         <label className="block text-sm font-medium mb-1">Uživatelské jméno</label>
//                         <input
//                             type="text"
//                             value={formData.name}
//                             onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//                             className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
//                         />
//                         {errors.name && (
//                             <p className="mt-1 text-sm text-red-600">{errors.name[0]}</p>
//                         )}
//                     </div>

//                     <div>
//                         <label className="block text-sm font-medium mb-1">Email</label>
//                         <input
//                             type="email"
//                             value={formData.email}
//                             onChange={(e) => setFormData({ ...formData, email: e.target.value })}
//                             className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
//                         />
//                         {errors.email && (
//                             <p className="mt-1 text-sm text-red-600">{errors.email[0]}</p>
//                         )}
//                     </div>

//                     <div className="border-t pt-4">
//                         <p className="text-sm text-gray-600 mb-3">Změna hesla (vyplňte pouze pokud chcete změnit heslo)</p>

//                         <div className="space-y-4">
//                             <div>
//                                 <label className="block text-sm font-medium mb-1">Nové heslo</label>
//                                 <input
//                                     type="password"
//                                     value={formData.password}
//                                     onChange={(e) => setFormData({ ...formData, password: e.target.value })}
//                                     className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
//                                     placeholder="Minimálně 8 znaků"
//                                 />
//                                 {errors.password && (
//                                     <p className="mt-1 text-sm text-red-600">{errors.password[0]}</p>
//                                 )}
//                             </div>

//                             <div>
//                                 <label className="block text-sm font-medium mb-1">Potvrzení hesla</label>
//                                 <input
//                                     type="password"
//                                     value={formData.password_confirmation}
//                                     onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
//                                     className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
//                                 />
//                             </div>
//                         </div>
//                     </div>

//                     <button
//                         type="submit"
//                         disabled={isLoading}
//                         className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
//                     >
//                         {isLoading ? 'Ukládám...' : 'Uložit změny'}
//                     </button>
//                 </form>
//             </section>

//             {/* Sekce pro smazání účtu */}
//             <section className="bg-white rounded-lg shadow p-6 border-2 border-red-200">
//                 <h2 className="text-2xl font-bold mb-4 text-red-600">Nebezpečná zóna</h2>

//                 {!showDeleteConfirm ? (
//                     <button
//                         onClick={() => setShowDeleteConfirm(true)}
//                         className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
//                     >
//                         Smazat účet
//                     </button>
//                 ) : (
//                     <div className="space-y-4">
//                         <div className="p-4 bg-red-50 border border-red-200 rounded">
//                             <p className="text-red-800 font-medium mb-2">⚠️ Varování</p>
//                             <p className="text-sm text-red-700">
//                                 Smazáním účtu trvale ztratíte všechna data včetně receptů. Tato akce je nevratná.
//                             </p>
//                         </div>

//                         <div>
//                             <label className="block text-sm font-medium mb-1">
//                                 Pro potvrzení zadejte své heslo:
//                             </label>
//                             <input
//                                 type="password"
//                                 value={deletePassword}
//                                 onChange={(e) => setDeletePassword(e.target.value)}
//                                 className="w-full px-3 py-2 border border-red-300 rounded focus:ring-2 focus:ring-red-500"
//                                 placeholder="Vaše heslo"
//                             />
//                             {errors.password && (
//                                 <p className="mt-1 text-sm text-red-600">{errors.password[0]}</p>
//                             )}
//                         </div>

//                         <div className="flex gap-3">
//                             <button
//                                 onClick={handleDelete}
//                                 disabled={isLoading}
//                                 className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
//                             >
//                                 {isLoading ? 'Mažu...' : 'Ano, smazat účet'}
//                             </button>
//                             <button
//                                 onClick={() => {
//                                     setShowDeleteConfirm(false);
//                                     setDeletePassword('');
//                                     setErrors({});
//                                 }}
//                                 className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
//                             >
//                                 Zrušit
//                             </button>
//                         </div>
//                     </div>
//                 )}
//             </section>
//         </div>
//     );
// }