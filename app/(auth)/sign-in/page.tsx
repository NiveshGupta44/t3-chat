"use client";

import React from "react";
import Image from 'next/image'
import { Button } from "@base-ui/react";
import { authClient } from "@/lib/auth-client";

const SignInPage = () =>{
    return (
        <section className="flex flex-col items-center justify-center min-h-screen bg-background px-4 py-16 md:py-32">
            <div className="flex flex-row justify-center items-center gap-x-2">
                <h1 className="text-3xl font-extrabold text-foreground">Welcome to</h1>
                <Image src ="/logo.svg" alt="logo" width={142} height={142} style={{ width: "150px", height: "auto" }}/>
            </div>
            <p className="mt-2 text-lg text-muted-foreground font-semibold">
                Sign in below (we'll increase your message limits if you do 😉)
            </p>

            <Button className={"mt-6 flex items-center justify-center gap-2 rounded-lg border px-5 py-5 bg-purple-800 cursor-pointer"}
            onClick={()=>authClient.signIn.social({
                provider:"github",
                callbackURL:"/"
            })}
            >
                <Image src={"/github.svg"} alt={"github"} width={24} height={24} />
                <span className="font-bold ml-2">Sign in with GitHub</span>
            </Button>
        </section>
    )
}

export default SignInPage