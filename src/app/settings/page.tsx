"use client";
import { SelectGroups } from "@/components/form/SelectGroups";
import { SelectMajor } from "@/components/form/SelectMajor";
import { SelectSpecialization } from "@/components/form/SelectSpetialization";
import { appConfig } from "@/config/appConfig";
import { Card, Divider } from "@mantine/core";
import { FaInfo } from "react-icons/fa";

export default function Settings() {
  return (
    <>
      <header className="bg-primary p-4 pt-12 font-bold text-2xl text-white z-20">
        <h1 className="grow overflow-auto">Ustawienia</h1>
      </header>
      <main className="flex flex-col grow p-4 min-w-0 min-h-0 overflow-auto">
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/25 text-primary w-7 h-7 flex justify-center items-center rounded-md">
              <FaInfo />
            </div>
            <h2 className="font-bold text-gray-500 text-lg">
              Informacje o studiach
            </h2>
          </div>
          <Card padding="lg" radius="md" withBorder p="sm">
            <SelectMajor
              inputStyles={{
                input: {
                  border: 0,
                },
                label: {
                  color: "gray",
                },
              }}
            />
            <Divider my="sm" />
            <SelectSpecialization
              inputStyles={{
                input: {
                  border: 0,
                },
                label: {
                  color: "gray",
                },
              }}
            />
            <Divider my="sm" />
            <SelectGroups
              inputStyles={{
                input: {
                  border: 0,
                },
                label: {
                  color: "gray",
                },
              }}
            />
          </Card>
          {/* <div className="flex items-center gap-3">
        <div className="bg-primary/25 text-primary w-7 h-7 flex justify-center items-center rounded-md">
          <FaBan />
        </div>
        <h2 className="font-bold text-gray-500 text-lg">Wykluczone zajęcia</h2>
      </div> */}
          <p className="mt-auto text-gray-400 text-sm text-center">
            v.{appConfig.version}
          </p>
        </div>
      </main>
    </>
  );
}
