import { requireUnAuth } from "@/modules/authentication/actions";
import React from "react";

export const AuthLayout = async({children}:{children:React.ReactNode}) =>{
    await requireUnAuth();
    return (
        <div>
            {children}
        </div>
    )
}

export default AuthLayout