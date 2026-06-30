-- CreateTable
CREATE TABLE "PatientSubmission" (
    "id" SERIAL NOT NULL,
    "patientAge" INTEGER NOT NULL,
    "selectedPathologies" TEXT[],
    "responses" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientSubmission_pkey" PRIMARY KEY ("id")
);
