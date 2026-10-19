import { useFormik } from "formik";
import * as Yup from "yup";
import { BottomSheet, TextField, Button, useToast } from "@/shared/ui";
import { useMutation } from "@/shared/hooks";
import { centrosService } from "../centros.service";

const schema = Yup.object({
    nombre: Yup.string().trim().required("El nombre es obligatorio"),
    ubicacion: Yup.string().trim().required("La ubicación es obligatoria"),
    direccion: Yup.string().trim().required("La dirección es obligatoria"),
    telefono: Yup.string().trim().matches(/^[\d\s+()-]{7,15}$/, "Teléfono inválido"),
});

export default function CentroForm({ visible, onClose, onSaved }) {
    const toast = useToast();
    const crear = useMutation(centrosService.create);

    const formik = useFormik({
        initialValues: { nombre: "", ubicacion: "", direccion: "", telefono: "" },
        validationSchema: schema,
        onSubmit: async (values, helpers) => {
            try {
                const centro = await crear.mutate(values);
                toast.show("Centro registrado correctamente");
                helpers.resetForm();
                onSaved?.(centro);
                onClose();
            } catch (error) {
                toast.show(error.message, "error");
            }
        },
    });

    return (
        <BottomSheet
            visible={visible}
            onClose={onClose}
            title="Nuevo centro"
            subtitle="Registra un centro de formación"
            icon="business-outline"
            footer={<Button title="Guardar centro" icon="save-outline" loading={crear.loading} onPress={formik.handleSubmit} />}
        >
            <TextField formik={formik} name="nombre" label="Nombre del centro" placeholder="Ej: Centro Agropecuario" />
            <TextField formik={formik} name="ubicacion" label="Ubicación" icon="location-outline" placeholder="Ej: Popayán, Norte" />
            <TextField formik={formik} name="direccion" label="Dirección" icon="map-outline" placeholder="Ej: Cl. 4 #2-67" />
            <TextField formik={formik} name="telefono" label="Teléfono (opcional)" icon="call-outline" keyboardType="phone-pad" />
        </BottomSheet>
    );
}
